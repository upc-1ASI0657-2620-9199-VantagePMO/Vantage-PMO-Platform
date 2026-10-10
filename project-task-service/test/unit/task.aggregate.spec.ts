import { Task } from '../../src/projects/domain/model/aggregates/task';
import { Milestone } from '../../src/projects/domain/model/entities/milestone';
import { MilestoneStatus } from '../../src/projects/domain/model/value-objects/milestone-status';
import { Priority } from '../../src/projects/domain/model/value-objects/priority';
import { TaskStatus } from '../../src/projects/domain/model/value-objects/task-status';

const projectId = '22222222-2222-4222-8222-222222222222';
const memberId = '33333333-3333-4333-8333-333333333333';

describe('Task aggregate', () => {
  it('is created as TODO with MEDIUM priority by default', () => {
    const t = Task.create({ projectId, title: 'Levantar requerimientos' });
    expect(t.status).toBe(TaskStatus.TODO);
    expect(t.priority).toBe(Priority.MEDIUM);
    expect(t.assignedTo).toBeNull();
  });

  it('requires a title of at most 200 characters', () => {
    expect(() => Task.create({ projectId, title: '' })).toThrow('title is required');
    expect(() => Task.create({ projectId, title: 'x'.repeat(201) })).toThrow('200 characters');
  });

  it('moves to IN_PROGRESS when a responsible is assigned (US04)', () => {
    const t = Task.create({ projectId, title: 'Diseñar BD' });
    t.assignTo(memberId);
    expect(t.assignedTo).toBe(memberId);
    expect(t.status).toBe(TaskStatus.IN_PROGRESS);
  });

  it('is completed with a single action and can be re-opened (US58)', () => {
    const t = Task.create({ projectId, title: 'Diseñar BD' });
    t.markComplete();
    expect(t.status).toBe(TaskStatus.DONE);
    expect(t.completedAt).toBeInstanceOf(Date);
    t.reopen();
    expect(t.status).toBe(TaskStatus.TODO);
    expect(t.completedAt).toBeNull();
  });

  it('cannot be reassigned once completed', () => {
    const t = Task.create({ projectId, title: 'Diseñar BD' });
    t.markComplete();
    expect(() => t.assignTo(memberId)).toThrow('cannot be reassigned');
  });
});

describe('Milestone entity', () => {
  it('is at risk when pending and due within 3 days', () => {
    const today = new Date('2026-10-10T12:00:00Z');
    expect(new Milestone('m1', projectId, 'Demo', '2026-10-12', MilestoneStatus.PENDING).isAtRisk(today)).toBe(true);
    expect(new Milestone('m2', projectId, 'Demo', '2026-10-20', MilestoneStatus.PENDING).isAtRisk(today)).toBe(false);
    expect(new Milestone('m3', projectId, 'Demo', '2026-10-01', MilestoneStatus.COMPLETED).isAtRisk(today)).toBe(false);
  });
});
