/** Kinds of notification shown in the bell (US63) and their origin event. */
export enum NotificationType {
  MILESTONE_DUE_SOON = 'MILESTONE_DUE_SOON',
  PROJECT_STALLED = 'PROJECT_STALLED',
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  MEMBER_ALLOCATED = 'MEMBER_ALLOCATED',
  MEMBER_OVERALLOCATED = 'MEMBER_OVERALLOCATED',
}

/** Urgent notifications are also sent through the e-mail channel. */
export const URGENT_TYPES: NotificationType[] = [NotificationType.MILESTONE_DUE_SOON, NotificationType.PROJECT_STALLED, NotificationType.MEMBER_OVERALLOCATED];
