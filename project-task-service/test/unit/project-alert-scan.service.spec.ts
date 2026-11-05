import { InMemoryEventBus } from '@vantage-pmo/event-bus';
import { ProjectAlertScanService } from '../../src/projects/application/internal/scheduled/project-alert-scan.service';
import { ProjectAlertReader } from '../../src/projects/domain/repositories/project-alert.reader';

const reader: ProjectAlertReader = {
  findPendingMilestonesDueBetween: async () => [
    { projectId: 'p1', projectName: 'ERP Minera', ownerId: 'u1', milestoneId: 'm1', milestoneName: 'Go-live', dueDate: '2026-11-08', status: 'PENDING' },
  ],
  findOpenProjectsActivity: async () => [
    { projectId: 'p1', projectName: 'ERP Minera', ownerId: 'u1', status: 'IN_PROGRESS', lastActivityAt: new Date('2026-11-08T08:00:00Z') },
    { projectId: 'p2', projectName: 'CRM Retail', ownerId: 'u2', status: 'IN_PROGRESS', lastActivityAt: new Date('2026-11-01T08:00:00Z') },
  ],
  findAllSnapshots: async () => [],
};

describe('ProjectAlertScanService', () => {
  it('publishes one event per milestone due soon and per stalled project', async () => {
    const bus = new InMemoryEventBus('project-task');
    const service = new ProjectAlertScanService(reader, bus);

    const result = await service.scan(new Date('2026-11-08T12:00:00Z'));

    expect(result.milestonesDueSoon).toBe(1);
    expect(result.stalledProjects).toBe(1);
    expect(bus.published.map((e) => e.type)).toEqual(['projects.milestone-due-soon', 'projects.project-stalled']);
    expect(bus.published[1].payload).toMatchObject({ projectId: 'p2', ownerId: 'u2', inactiveHours: 172 });
  });

  it('publishes the same keys when the scan runs twice for the same facts', async () => {
    const bus = new InMemoryEventBus('project-task');
    const service = new ProjectAlertScanService(reader, bus);
    await service.scan(new Date('2026-11-08T12:00:00Z'));
    await service.scan(new Date('2026-11-08T13:00:00Z'));
    const keys = bus.published.map((e) => e.key);
    expect(new Set(keys).size).toBe(2);
  });
});
