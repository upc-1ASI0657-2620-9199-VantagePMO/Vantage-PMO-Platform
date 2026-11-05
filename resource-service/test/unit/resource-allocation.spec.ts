import { ResourceAllocation } from '../../src/resources/domain/model/aggregates/resource-allocation';
import { ProjectReference } from '../../src/resources/domain/model/entities/project-reference';
import { AvailabilityStatus } from '../../src/resources/domain/model/value-objects/availability-status';
import { DateRange } from '../../src/resources/domain/model/value-objects/date-range';
import { CapacityPolicy } from '../../src/resources/domain/services/capacity-policy';

const project: ProjectReference = {
  id: 'p1', name: 'ERP Logística', ownerId: 'owner', status: 'IN_PROGRESS', startDate: '2026-11-01', endDate: '2027-01-31',
};
const allocate = (memberId: string, percentage: number, startDate = '2026-11-09', endDate = '2026-12-18', projectId = 'p1') =>
  ResourceAllocation.create({ projectId, memberId, role: 'Analista', percentage, startDate, endDate, assignedBy: 'owner' });

describe('ResourceAllocation aggregate (US14)', () => {
  it('links a member to a project with a role, share of time and period', () => {
    const a = allocate('m1', 50);
    expect(a.percentage).toBe(50);
    expect(a.role).toBe('Analista');
    expect(a.period.startDate).toBe('2026-11-09');
  });

  it('only accepts integer shares between 1 and 100 %', () => {
    expect(() => allocate('m1', 0)).toThrow('between 1 and 100');
    expect(() => allocate('m1', 120)).toThrow('between 1 and 100');
    expect(() => allocate('m1', 33.5)).toThrow('between 1 and 100');
  });

  it('rejects an end date before the start date', () => {
    expect(() => allocate('m1', 50, '2026-12-18', '2026-11-09')).toThrow('cannot be before');
  });

  it('can change its share and period', () => {
    const a = allocate('m1', 50);
    a.change({ percentage: 30, endDate: '2026-12-31' });
    expect(a.percentage).toBe(30);
    expect(a.endDate).toBe('2026-12-31');
  });
});

describe('CapacityPolicy', () => {
  it('rejects allocations in closed projects or outside the project period', () => {
    expect(() => CapacityPolicy.ensureCanAllocate({ ...project, status: 'COMPLETED' }, allocate('m1', 50), [])).toThrow('no longer be allocated');
    expect(() => CapacityPolicy.ensureCanAllocate(project, allocate('m1', 50, '2026-10-01', '2026-11-30'), [])).toThrow('inside the project period');
  });

  it('rejects a second overlapping allocation of the same member in the same project', () => {
    const existing = allocate('m1', 50);
    expect(() => CapacityPolicy.ensureCanAllocate(project, allocate('m1', 20, '2026-12-01', '2026-12-31'), [existing])).toThrow('already has an allocation');
    expect(() => CapacityPolicy.ensureCanAllocate(project, allocate('m1', 20, '2026-12-19', '2026-12-31'), [existing])).not.toThrow();
  });

  it('adds the shares of overlapping allocations and detects overallocation', () => {
    const period = DateRange.of('2026-11-09', '2026-12-18');
    const loads = [allocate('m1', 60), allocate('m1', 50, '2026-12-01', '2026-12-31', 'p2'), allocate('m1', 40, '2027-01-05', '2027-01-20', 'p3')];
    const total = CapacityPolicy.totalAllocated(loads, period);
    expect(total).toBe(110);
    expect(CapacityPolicy.isOverallocated(total)).toBe(true);
  });

  it('classifies the availability of a member (US15)', () => {
    expect(CapacityPolicy.availability(0)).toEqual({ available: 100, status: AvailabilityStatus.AVAILABLE });
    expect(CapacityPolicy.availability(70)).toEqual({ available: 30, status: AvailabilityStatus.PARTIAL });
    expect(CapacityPolicy.availability(100)).toEqual({ available: 0, status: AvailabilityStatus.FULL });
    expect(CapacityPolicy.availability(130)).toEqual({ available: 0, status: AvailabilityStatus.OVERALLOCATED });
  });
});
