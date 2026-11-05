import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { ResourceAllocation } from '../../../domain/model/aggregates/resource-allocation';
import { Member } from '../../../domain/model/entities/member';
import { AvailabilityStatus } from '../../../domain/model/value-objects/availability-status';
import { DateRange } from '../../../domain/model/value-objects/date-range';
import { GetAllocationsByProjectQuery, GetResourceAvailabilityQuery } from '../../../domain/model/queries/resource-queries';
import { AllocationRepository } from '../../../domain/repositories/allocation.repository';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { ProjectReferenceRepository } from '../../../domain/repositories/project-reference.repository';
import { CapacityPolicy } from '../../../domain/services/capacity-policy';

export interface MemberAvailability {
  member: Member;
  allocatedPercentage: number;
  availablePercentage: number;
  status: AvailabilityStatus;
  allocations: { allocationId: string; projectId: string; projectName: string; role: string; percentage: number; startDate: string; endDate: string }[];
}

/** Read use cases of Resource Management (US14, US15). */
@Injectable()
export class ResourceQueryService {
  constructor(
    private readonly allocations: AllocationRepository,
    private readonly members: MemberRepository,
    private readonly projects: ProjectReferenceRepository,
  ) {}

  async handleGetByProject(query: GetAllocationsByProjectQuery): Promise<{ allocations: ResourceAllocation[]; members: Map<string, Member> }> {
    if (!(await this.projects.findById(query.projectId))) throw new ResourceNotFoundError('Project', query.projectId);
    const allocations = await this.allocations.findByProjectId(query.projectId);
    const members = new Map<string, Member>();
    for (const a of allocations) {
      const m = await this.members.findById(a.memberId);
      if (m) members.set(m.id, m);
    }
    return { allocations, members };
  }

  /** US15: free capacity of every member in a period, to decide new assignments. */
  async handleGetAvailability(query: GetResourceAvailabilityQuery): Promise<MemberAvailability[]> {
    const period = DateRange.of(query.from, query.to);
    const [members, allocations] = await Promise.all([
      this.members.findAll(),
      this.allocations.findOverlapping(period.startDate, period.endDate),
    ]);
    const projects = new Map((await this.projects.findByIds([...new Set(allocations.map((a) => a.projectId))])).map((p) => [p.id, p]));

    return members
      .map((member) => {
        const own = allocations.filter((a) => a.memberId === member.id);
        const allocated = CapacityPolicy.totalAllocated(own, period);
        const { available, status } = CapacityPolicy.availability(allocated);
        return {
          member,
          allocatedPercentage: allocated,
          availablePercentage: available,
          status,
          allocations: own.map((a) => ({
            allocationId: a.id, projectId: a.projectId, projectName: projects.get(a.projectId)?.name ?? '',
            role: a.role, percentage: a.percentage, startDate: a.startDate, endDate: a.endDate,
          })),
        };
      })
      .filter((m) => m.availablePercentage >= query.minAvailable)
      .sort((a, b) => b.availablePercentage - a.availablePercentage || a.member.fullName.localeCompare(b.member.fullName));
  }
}
