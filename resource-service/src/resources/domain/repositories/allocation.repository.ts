import { ResourceAllocation } from '../model/aggregates/resource-allocation';

export abstract class AllocationRepository {
  abstract save(allocation: ResourceAllocation): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<ResourceAllocation | null>;
  abstract findByProjectId(projectId: string): Promise<ResourceAllocation[]>;
  abstract findByMemberId(memberId: string): Promise<ResourceAllocation[]>;
  /** Allocations of any member overlapping [from, to]. */
  abstract findOverlapping(from: string, to: string): Promise<ResourceAllocation[]>;
}
