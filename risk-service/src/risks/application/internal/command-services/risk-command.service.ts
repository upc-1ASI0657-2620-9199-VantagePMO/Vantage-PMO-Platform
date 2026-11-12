import { Inject, Injectable, Logger } from '@nestjs/common';
import { EVENT_BUS, EventPublisher } from '@vantage-pmo/event-bus';
import { DomainError, ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { Risk } from '../../../domain/model/aggregates/risk';
import { ChangeRiskStatusCommand, ReassessRiskCommand, RegisterRiskCommand } from '../../../domain/model/commands/risk-commands';
import { isProjectClosed, ProjectReference } from '../../../domain/model/entities/project-reference';
import { CriticalRiskPayload, RiskEvents } from '../../../domain/model/events/risk-events';
import { RiskLevel } from '../../../domain/model/value-objects/risk-score';
import { ProjectReferenceRepository } from '../../../domain/repositories/project-reference.repository';
import { RiskRepository } from '../../../domain/repositories/risk.repository';

/** Write use cases of Risk Management (US28, US29). */
@Injectable()
export class RiskCommandService {
  private readonly logger = new Logger(RiskCommandService.name);

  constructor(
    private readonly risks: RiskRepository,
    private readonly projects: ProjectReferenceRepository,
    @Inject(EVENT_BUS) private readonly events: EventPublisher,
  ) {}

  async handleRegister(command: RegisterRiskCommand): Promise<Risk> {
    const project = await this.projects.findById(command.projectId);
    if (!project) throw new ResourceNotFoundError('Project', command.projectId);
    if (isProjectClosed(project)) throw new DomainError(`Project '${project.name}' is ${project.status}; new risks cannot be registered.`, 'project-closed');
    const risk = Risk.register({ ...command });
    await this.risks.save(risk);
    await this.events.publish(RiskEvents.RISK_REGISTERED, { riskId: risk.id, projectId: risk.projectId, title: risk.title, score: risk.score, level: risk.level });
    await this.announceIfCritical(risk, project, RiskLevel.LOW);
    this.logger.log(`Risk ${risk.id} registered in project ${project.id} with score ${risk.score} (${risk.level})`);
    return risk;
  }

  async handleReassess(command: ReassessRiskCommand): Promise<Risk> {
    const risk = await this.load(command.riskId);
    const previous = risk.level;
    risk.reassess(command.probability, command.impact, command.note ?? null, command.assessedBy);
    await this.risks.save(risk);
    const project = await this.projects.findById(risk.projectId);
    if (project) await this.announceIfCritical(risk, project, previous);
    return risk;
  }

  async handleChangeStatus(command: ChangeRiskStatusCommand): Promise<Risk> {
    const risk = await this.load(command.riskId);
    risk.changeStatus(command.status, command.mitigationPlan);
    await this.risks.save(risk);
    return risk;
  }

  /** A risk that becomes critical is announced once per evaluation so its owner is warned. */
  private async announceIfCritical(risk: Risk, project: ProjectReference, previousLevel: RiskLevel): Promise<void> {
    if (!risk.isCritical || previousLevel === RiskLevel.CRITICAL) return;
    const payload: CriticalRiskPayload = {
      riskId: risk.id, projectId: project.id, projectName: project.name, ownerId: project.ownerId, responsibleId: risk.responsibleId,
      title: risk.title, probability: risk.current.probability, impact: risk.current.impact, score: risk.score,
    };
    await this.events.publish(RiskEvents.CRITICAL_RISK_IDENTIFIED, payload, `critical-risk:${risk.id}:${risk.current.number}`);
  }

  private async load(id: string): Promise<Risk> {
    const risk = await this.risks.findById(id);
    if (!risk) throw new ResourceNotFoundError('Risk', id);
    return risk;
  }
}
