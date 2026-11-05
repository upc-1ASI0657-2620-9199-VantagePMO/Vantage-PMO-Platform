import { DomainError } from '../../../shared/domain/domain-error';
import { ResourceAllocation } from '../model/aggregates/resource-allocation';
import { ProjectReference, isProjectClosed } from '../model/entities/project-reference';
import { AvailabilityStatus } from '../model/value-objects/availability-status';
import { DateRange } from '../model/value-objects/date-range';

/**
 * Domain service with the capacity rules of a member (US14, US15).
 * A member has 100 % of capacity; exceeding it is allowed (the PMO decides) but raises a warning
 * event so the project owner is notified.
 */
export class CapacityPolicy {
  static readonly FULL_CAPACITY = 100;

  static ensureCanAllocate(project: ProjectReference, allocation: ResourceAllocation, sameProject: ResourceAllocation[]): void {
    if (isProjectClosed(project)) {
      throw new DomainError(`Project '${project.name}' is ${project.status}; members can no longer be allocated.`, 'project-closed');
    }
    if (!allocation.period.isWithin(DateRange.of(project.startDate, project.endDate))) {
      throw new DomainError(
        `The allocation period must be inside the project period (${project.startDate} to ${project.endDate}).`,
        'allocation-out-of-project-period',
      );
    }
    if (sameProject.some((a) => a.id !== allocation.id && a.memberId === allocation.memberId && a.overlaps(allocation.period))) {
      throw new DomainError('The member already has an allocation in this project for an overlapping period.', 'duplicated-allocation');
    }
  }

  /** Sum of the shares of every allocation that overlaps the period (worst case of the period). */
  static totalAllocated(allocations: ResourceAllocation[], period: DateRange): number {
    return allocations.filter((a) => a.overlaps(period)).reduce((sum, a) => sum + a.percentage, 0);
  }

  static isOverallocated(total: number): boolean {
    return total > CapacityPolicy.FULL_CAPACITY;
  }

  static availability(total: number): { available: number; status: AvailabilityStatus } {
    const available = Math.max(0, CapacityPolicy.FULL_CAPACITY - total);
    let status = AvailabilityStatus.PARTIAL;
    if (total === 0) status = AvailabilityStatus.AVAILABLE;
    else if (total === CapacityPolicy.FULL_CAPACITY) status = AvailabilityStatus.FULL;
    else if (total > CapacityPolicy.FULL_CAPACITY) status = AvailabilityStatus.OVERALLOCATED;
    return { available, status };
  }
}
