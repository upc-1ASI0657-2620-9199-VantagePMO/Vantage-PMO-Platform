import { AllocationResult } from '../../../application/internal/command-services/allocation-command.service';
import { MemberAvailability } from '../../../application/internal/query-services/resource-query.service';
import { ResourceAllocation } from '../../../domain/model/aggregates/resource-allocation';
import { AllocationResource, AllocationResultResource, MemberAvailabilityResource } from '../resources/allocation.resources';

export class AllocationAssembler {
  static toResource(a: ResourceAllocation, memberName?: string): AllocationResource {
    return {
      id: a.id, projectId: a.projectId, memberId: a.memberId, memberName, role: a.role, percentage: a.percentage,
      startDate: a.startDate, endDate: a.endDate, assignedBy: a.assignedBy,
    };
  }

  static toResult(r: AllocationResult): AllocationResultResource {
    return { ...AllocationAssembler.toResource(r.allocation), memberTotalAllocation: r.memberTotalAllocation, overallocated: r.overallocated };
  }

  static toAvailability(m: MemberAvailability): MemberAvailabilityResource {
    return {
      memberId: m.member.id, fullName: m.member.fullName, email: m.member.email, role: m.member.role,
      allocatedPercentage: m.allocatedPercentage, availablePercentage: m.availablePercentage, status: m.status, allocations: m.allocations,
    };
  }
}
