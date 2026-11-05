import { Inject, Injectable, Logger } from '@nestjs/common';
import { EVENT_BUS, EventPublisher } from '@vantage-pmo/event-bus';
import { ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { ResourceAllocation } from '../../../domain/model/aggregates/resource-allocation';
import { AllocateMemberCommand, ChangeAllocationCommand, ReleaseAllocationCommand } from '../../../domain/model/commands/resource-commands';
import { MemberAllocatedPayload, MemberOverallocatedPayload, ResourceEvents } from '../../../domain/model/events/resource-events';
import { AllocationRepository } from '../../../domain/repositories/allocation.repository';
import { MemberRepository } from '../../../domain/repositories/member.repository';
import { ProjectReferenceRepository } from '../../../domain/repositories/project-reference.repository';
import { CapacityPolicy } from '../../../domain/services/capacity-policy';

export interface AllocationResult {
  allocation: ResourceAllocation;
  memberTotalAllocation: number;
  overallocated: boolean;
}

/** Write use cases of Resource Management (US14). */
@Injectable()
export class AllocationCommandService {
  private readonly logger = new Logger(AllocationCommandService.name);

  constructor(
    private readonly allocations: AllocationRepository,
    private readonly members: MemberRepository,
    private readonly projects: ProjectReferenceRepository,
    @Inject(EVENT_BUS) private readonly events: EventPublisher,
  ) {}

  async handleAllocate(command: AllocateMemberCommand): Promise<AllocationResult> {
    const member = await this.members.findById(command.memberId);
    if (!member) throw new ResourceNotFoundError('Member', command.memberId);
    const project = await this.projects.findById(command.projectId);
    if (!project) throw new ResourceNotFoundError('Project', command.projectId);

    const allocation = ResourceAllocation.create(command);
    CapacityPolicy.ensureCanAllocate(project, allocation, await this.allocations.findByProjectId(project.id));
    await this.allocations.save(allocation);

    const payload: MemberAllocatedPayload = {
      allocationId: allocation.id, memberId: member.id, projectId: project.id, projectName: project.name,
      role: allocation.role, percentage: allocation.percentage, startDate: allocation.startDate, endDate: allocation.endDate,
    };
    await this.events.publish(ResourceEvents.MEMBER_ALLOCATED, payload, `member-allocated:${allocation.id}`);
    this.logger.log(`Member ${member.id} allocated ${allocation.percentage}% to project ${project.id}`);
    return this.withCapacity(allocation);
  }

  async handleChange(command: ChangeAllocationCommand): Promise<AllocationResult> {
    const allocation = await this.load(command.allocationId);
    allocation.change(command);
    const project = await this.projects.findById(allocation.projectId);
    if (!project) throw new ResourceNotFoundError('Project', allocation.projectId);
    CapacityPolicy.ensureCanAllocate(project, allocation, await this.allocations.findByProjectId(project.id));
    await this.allocations.save(allocation);
    return this.withCapacity(allocation);
  }

  async handleRelease(command: ReleaseAllocationCommand): Promise<void> {
    const allocation = await this.load(command.allocationId);
    await this.allocations.delete(allocation.id);
  }

  /** Recomputes the member load in the allocation period and warns the project owner when it exceeds 100 %. */
  private async withCapacity(allocation: ResourceAllocation): Promise<AllocationResult> {
    const total = CapacityPolicy.totalAllocated(await this.allocations.findByMemberId(allocation.memberId), allocation.period);
    const overallocated = CapacityPolicy.isOverallocated(total);
    if (overallocated) {
      const [member, project] = await Promise.all([this.members.findById(allocation.memberId), this.projects.findById(allocation.projectId)]);
      const payload: MemberOverallocatedPayload = {
        memberId: allocation.memberId, memberName: member?.fullName ?? '', projectId: allocation.projectId,
        projectName: project?.name ?? '', ownerId: project?.ownerId ?? '', totalAllocation: total,
        startDate: allocation.startDate, endDate: allocation.endDate,
      };
      await this.events.publish(ResourceEvents.MEMBER_OVERALLOCATED, payload, `member-overallocated:${allocation.id}:${total}`);
      this.logger.warn(`Member ${allocation.memberId} is overallocated (${total}%)`);
    }
    return { allocation, memberTotalAllocation: total, overallocated };
  }

  private async load(id: string): Promise<ResourceAllocation> {
    const allocation = await this.allocations.findById(id);
    if (!allocation) throw new ResourceNotFoundError('Allocation', id);
    return allocation;
  }
}
