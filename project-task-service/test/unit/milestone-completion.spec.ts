import { InMemoryEventBus } from '@vantage-pmo/event-bus';
import { DocumentRequirementSyncHandler } from '../../src/projects/application/internal/event-handlers/document-requirement-sync.handler';
import { Project } from '../../src/projects/domain/model/aggregates/project';
import { MilestoneDocumentRequirement } from '../../src/projects/domain/model/entities/milestone-document-requirement';
import { MilestoneStatus } from '../../src/projects/domain/model/value-objects/milestone-status';
import { MilestoneDocumentRequirementRepository } from '../../src/projects/domain/repositories/milestone-document-requirement.repository';
import { DomainError, ResourceNotFoundError } from '../../src/shared/domain/domain-error';

class InMemoryRequirements extends MilestoneDocumentRequirementRepository {
  items = new Map<string, MilestoneDocumentRequirement>();
  async upsert(r: MilestoneDocumentRequirement) { this.items.set(r.requirementId, r); }
  async markFulfilled(id: string) { const r = this.items.get(id); if (r) r.fulfilled = true; }
  async remove(id: string) { this.items.delete(id); }
  async findPendingByMilestone(m: string) { return [...this.items.values()].filter((r) => r.milestoneId === m && !r.fulfilled); }
}

const newProject = () =>
  Project.create({ name: 'ERP Logística', client: 'Transportes Andinos', startDate: '2026-10-12', endDate: '2027-01-29', budget: 85000, ownerId: 'owner' });

describe('Milestone closure with mandatory documents (US22, US49)', () => {
  it('completes a milestone without pending documents', () => {
    const project = newProject();
    const m = project.addMilestone('Go-live', '2026-12-15');
    project.completeMilestone(m.id, []);
    expect(m.status).toBe(MilestoneStatus.COMPLETED);
  });

  it('blocks the closure and lists the missing documents', () => {
    const project = newProject();
    const m = project.addMilestone('Go-live', '2026-12-15');
    expect(() => project.completeMilestone(m.id, ['Acta de aceptación', 'Plan de pruebas'])).toThrow(/Acta de aceptación, Plan de pruebas/);
    expect(m.status).toBe(MilestoneStatus.PENDING);
  });

  it('rejects unknown or already completed milestones', () => {
    const project = newProject();
    const m = project.addMilestone('Go-live', '2026-12-15');
    expect(() => project.completeMilestone('missing', [])).toThrow(ResourceNotFoundError);
    project.completeMilestone(m.id, []);
    expect(() => project.completeMilestone(m.id, [])).toThrow(DomainError);
  });

  it('keeps the replica of requirements in sync with the Document context events', async () => {
    const bus = new InMemoryEventBus('project-task');
    const repo = new InMemoryRequirements();
    new DocumentRequirementSyncHandler(bus, repo).onModuleInit();
    const base = { projectId: 'p1', milestoneId: 'm1' };
    await bus.publish('documents.requirement-defined', { ...base, requirementId: 'r1', name: 'Acta de aceptación' });
    await bus.publish('documents.requirement-defined', { ...base, requirementId: 'r2', name: 'Plan de pruebas' });
    await bus.publish('documents.requirement-fulfilled', { ...base, requirementId: 'r1' });
    await bus.publish('documents.requirement-removed', { ...base, requirementId: 'r2' });
    expect(await repo.findPendingByMilestone('m1')).toEqual([]);
    expect(repo.items.get('r1')!.fulfilled).toBe(true);
  });
});
