import { InMemoryEventBus } from '@vantage-pmo/event-bus';
import { RiskCommandService } from '../../src/risks/application/internal/command-services/risk-command.service';
import { ProjectSyncHandler } from '../../src/risks/application/internal/event-handlers/project-sync.handler';
import { RiskQueryService } from '../../src/risks/application/internal/query-services/risk-query.service';
import { Risk } from '../../src/risks/domain/model/aggregates/risk';
import { RegisterRiskCommand, ReassessRiskCommand } from '../../src/risks/domain/model/commands/risk-commands';
import { ProjectReference } from '../../src/risks/domain/model/entities/project-reference';
import { GetPriorityRisksQuery, GetProjectRisksQuery } from '../../src/risks/domain/model/queries/risk-queries';
import { RiskLevel, RiskScore } from '../../src/risks/domain/model/value-objects/risk-score';
import { RiskCategory, RiskStatus } from '../../src/risks/domain/model/value-objects/risk-status';
import { ProjectReferenceRepository } from '../../src/risks/domain/repositories/project-reference.repository';
import { RiskRepository } from '../../src/risks/domain/repositories/risk.repository';
import { RiskPrioritizationPolicy } from '../../src/risks/domain/services/risk-prioritization-policy';
import { DomainError } from '../../src/shared/domain/domain-error';

const newRisk = (title: string, probability: number, impact: number) =>
  Risk.register({ projectId: 'p1', title, category: RiskCategory.TECHNICAL, probability, impact, identifiedBy: 'u1' });

class InMemoryRisks extends RiskRepository {
  items = new Map<string, Risk>();
  async save(r: Risk) { this.items.set(r.id, r); }
  async findById(id: string) { return this.items.get(id) ?? null; }
  async findByProject(p: string) { return [...this.items.values()].filter((r) => r.projectId === p); }
  async findOpen() { return [...this.items.values()].filter((r) => r.isOpen); }
}
class InMemoryProjects extends ProjectReferenceRepository {
  items = new Map<string, ProjectReference>();
  async upsert(p: ProjectReference) { this.items.set(p.id, p); }
  async findById(id: string) { return this.items.get(id) ?? null; }
  async findByIds(ids: string[]) { return ids.map((i) => this.items.get(i)!).filter(Boolean); }
}

describe('RiskScore value object (US28)', () => {
  it.each([[1, 4, 4, 'LOW'], [2, 3, 6, 'MEDIUM'], [3, 4, 12, 'HIGH'], [4, 5, 20, 'CRITICAL'], [5, 3, 15, 'CRITICAL']])(
    'P=%i x I=%i gives score %i (%s)', (p, i, score, level) => {
      const s = RiskScore.of(p, i);
      expect(s.value).toBe(score);
      expect(s.level).toBe(level);
    });

  it('only accepts values from 1 to 5', () => {
    expect(() => RiskScore.of(0, 3)).toThrow(DomainError);
    expect(() => RiskScore.of(3, 6)).toThrow(DomainError);
  });
});

describe('Risk aggregate (US29)', () => {
  it('keeps the history of evaluations and lowers the severity after mitigation', () => {
    const r = newRisk('Proveedor RFID', 4, 5);
    r.changeStatus(RiskStatus.MITIGATING, 'Cotizar un segundo proveedor');
    r.reassess(2, 4, 'Segundo proveedor confirmado', 'u1');
    expect(r.assessments.map((a) => a.score)).toEqual([20, 8]);
    expect(r.level).toBe(RiskLevel.MEDIUM);
  });

  it('requires a mitigation plan and valid transitions', () => {
    const r = newRisk('Rotación del equipo', 3, 3);
    expect(() => r.changeStatus(RiskStatus.MITIGATING)).toThrow('mitigation plan');
    expect(() => r.changeStatus(RiskStatus.MITIGATED)).toThrow('cannot move');
    r.changeStatus(RiskStatus.CLOSED);
    expect(() => r.reassess(1, 1, null, 'u1')).toThrow('closed');
  });
});

describe('RiskPrioritizationPolicy (US30, US55)', () => {
  it('puts open critical risks first, then by score, impact and probability', () => {
    const low = newRisk('Bajo', 1, 2);
    const highImpact = newRisk('Alto impacto', 3, 4);
    const highProb = newRisk('Alta probabilidad', 4, 3);
    const critical = newRisk('Crítico', 5, 4);
    const closed = newRisk('Cerrado', 5, 5);
    closed.changeStatus(RiskStatus.CLOSED);
    const sorted = RiskPrioritizationPolicy.sort([low, highProb, closed, highImpact, critical]);
    expect(sorted.map((r) => r.title)).toEqual(['Crítico', 'Alto impacto', 'Alta probabilidad', 'Bajo', 'Cerrado']);
    expect(critical.isCritical).toBe(true);
    expect(closed.isCritical).toBe(false);
  });
});

describe('Risk Management application layer', () => {
  let bus: InMemoryEventBus;
  let risks: InMemoryRisks;
  let projects: InMemoryProjects;
  let commands: RiskCommandService;

  beforeEach(async () => {
    bus = new InMemoryEventBus('risk');
    risks = new InMemoryRisks();
    projects = new InMemoryProjects();
    new ProjectSyncHandler(bus, projects).onModuleInit();
    commands = new RiskCommandService(risks, projects, bus);
    await bus.publish('projects.project-registered', { projectId: 'p1', name: 'ERP Logística', ownerId: 'owner', status: 'IN_PROGRESS' });
  });

  const register = (title: string, p: number, i: number) =>
    commands.handleRegister(new RegisterRiskCommand('p1', title, undefined, RiskCategory.SCHEDULE, p, i, undefined, undefined, 'u1'));

  it('warns the project owner once when a risk is critical', async () => {
    const r = await register('Proveedor RFID', 4, 5);
    const warning = bus.published.find((e) => e.type === 'risks.critical-risk-identified')!;
    expect(warning.payload).toMatchObject({ riskId: r.id, ownerId: 'owner', score: 20 });
    await commands.handleReassess(new ReassessRiskCommand(r.id, 5, 5, 'Empeoró', 'u1'));
    expect(bus.published.filter((e) => e.type === 'risks.critical-risk-identified')).toHaveLength(1);
  });

  it('announces a risk that becomes critical after a re-evaluation', async () => {
    const r = await register('Alcance', 2, 3);
    await commands.handleReassess(new ReassessRiskCommand(r.id, 4, 4, null as unknown as string, 'u1'));
    expect(bus.published.filter((e) => e.type === 'risks.critical-risk-identified')).toHaveLength(1);
  });

  it('lists the project register and the portfolio priority view', async () => {
    await register('Bajo', 1, 1);
    await register('Crítico', 5, 5);
    await register('Alto', 3, 4);
    const queries = new RiskQueryService(risks, projects);
    expect((await queries.handleGetByProject(new GetProjectRisksQuery('p1'))).map((r) => r.title)).toEqual(['Crítico', 'Alto', 'Bajo']);
    const priority = await queries.handleGetPriority(new GetPriorityRisksQuery(RiskLevel.HIGH));
    expect(priority.risks.map((r) => r.title)).toEqual(['Crítico', 'Alto']);
    expect(priority.projects.get('p1')!.name).toBe('ERP Logística');
  });

  it('rejects risks for closed projects', async () => {
    await bus.publish('projects.project-status-changed', { projectId: 'p1', name: 'ERP Logística', ownerId: 'owner', status: 'COMPLETED' });
    await expect(register('Tarde', 3, 3)).rejects.toThrow('cannot be registered');
  });
});
