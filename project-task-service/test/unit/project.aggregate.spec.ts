import { Project } from '../../src/projects/domain/model/aggregates/project';
import { ProjectStatus } from '../../src/projects/domain/model/value-objects/project-status';
import { DomainError } from '../../src/shared/domain/domain-error';

const ownerId = '11111111-1111-4111-8111-111111111111';
const newProject = () =>
  Project.create({ name: 'ERP Logística', client: 'Transportes Andinos', startDate: '2026-10-12', endDate: '2027-01-29', budget: 85000, ownerId });

describe('Project aggregate', () => {
  it('is created in PLANNED status with its master data (US01)', () => {
    const p = newProject();
    expect(p.status).toBe(ProjectStatus.PLANNED);
    expect(p.client).toBe('Transportes Andinos');
    expect(p.budget).toBe(85000);
    expect(p.currency).toBe('PEN');
  });

  it('rejects an end date before the start date', () => {
    expect(() =>
      Project.create({ name: 'X', client: 'Y', startDate: '2026-10-12', endDate: '2026-09-01', budget: 0, ownerId }),
    ).toThrow(DomainError);
  });

  it('rejects a negative budget and blank names', () => {
    expect(() => Project.create({ name: 'X', client: 'Y', startDate: '2026-10-12', endDate: '2026-11-01', budget: -1, ownerId })).toThrow(
      'non-negative',
    );
    expect(() => Project.create({ name: '  ', client: 'Y', startDate: '2026-10-12', endDate: '2026-11-01', budget: 1, ownerId })).toThrow(
      'name is required',
    );
  });

  it('follows the lifecycle state machine (US26 / US48)', () => {
    const p = newProject();
    p.updateStatus(ProjectStatus.IN_PROGRESS);
    p.updateStatus(ProjectStatus.ON_HOLD);
    p.updateStatus(ProjectStatus.IN_PROGRESS);
    p.updateStatus(ProjectStatus.COMPLETED);
    expect(p.status).toBe(ProjectStatus.COMPLETED);
    expect(p.isClosed).toBe(true);
  });

  it('does not allow skipping or reverting phases', () => {
    const p = newProject();
    expect(() => p.updateStatus(ProjectStatus.COMPLETED)).toThrow('Cannot change project status from PLANNED to COMPLETED');
    p.updateStatus(ProjectStatus.CANCELLED);
    expect(() => p.updateStatus(ProjectStatus.IN_PROGRESS)).toThrow(DomainError);
  });

  it('accepts milestones only inside the project period', () => {
    const p = newProject();
    const m = p.addMilestone('Go-live', '2026-12-15');
    expect(p.hasMilestone(m.id)).toBe(true);
    expect(() => p.addMilestone('Fuera de rango', '2027-03-01')).toThrow('within the project period');
  });

  it('cannot shrink the period leaving milestones outside of it', () => {
    const p = newProject();
    p.addMilestone('Go-live', '2026-12-15');
    expect(() =>
      p.updateDetails({ name: 'ERP', client: 'Andinos', startDate: '2026-10-12', endDate: '2026-11-30', budget: 1 }),
    ).toThrow('outside the new project period');
  });

  it('cannot be modified once closed', () => {
    const p = newProject();
    p.updateStatus(ProjectStatus.CANCELLED);
    expect(() => p.addMilestone('Go-live', '2026-12-15')).toThrow('can no longer be modified');
  });
});
