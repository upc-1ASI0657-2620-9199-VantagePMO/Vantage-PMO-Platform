/** Events consumed from other contexts and published by Resource Management. */
export const ConsumedEvents = {
  USER_REGISTERED: 'iam.user-registered',
  PROJECT_REGISTERED: 'projects.project-registered',
  PROJECT_UPDATED: 'projects.project-updated',
  PROJECT_STATUS_CHANGED: 'projects.project-status-changed',
} as const;

export const ResourceEvents = {
  MEMBER_ALLOCATED: 'resources.member-allocated',
  MEMBER_OVERALLOCATED: 'resources.member-overallocated',
} as const;

export interface MemberAllocatedPayload {
  allocationId: string;
  memberId: string;
  projectId: string;
  projectName: string;
  role: string;
  percentage: number;
  startDate: string;
  endDate: string;
}

export interface MemberOverallocatedPayload {
  memberId: string;
  memberName: string;
  projectId: string;
  projectName: string;
  ownerId: string;
  totalAllocation: number;
  startDate: string;
  endDate: string;
}
