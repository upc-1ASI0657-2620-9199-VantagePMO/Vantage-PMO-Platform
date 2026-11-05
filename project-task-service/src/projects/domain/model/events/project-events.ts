/** Integration events published by the Project & Task bounded context (published language). */
export const ProjectEvents = {
  PROJECT_REGISTERED: 'projects.project-registered',
  PROJECT_UPDATED: 'projects.project-updated',
  PROJECT_STATUS_CHANGED: 'projects.project-status-changed',
  TASK_ASSIGNED: 'projects.task-assigned',
  MILESTONE_DUE_SOON: 'projects.milestone-due-soon',
  PROJECT_STALLED: 'projects.project-stalled',
} as const;

export interface ProjectSnapshotPayload {
  projectId: string;
  name: string;
  client: string;
  ownerId: string;
  status: string;
  startDate: string;
  endDate: string;
  replay?: boolean;
}

export interface TaskAssignedPayload {
  taskId: string;
  title: string;
  projectId: string;
  projectName: string;
  assigneeId: string;
  dueDate: string | null;
}

export interface MilestoneDueSoonPayload {
  projectId: string;
  projectName: string;
  ownerId: string;
  milestoneId: string;
  milestoneName: string;
  dueDate: string;
}

export interface ProjectStalledPayload {
  projectId: string;
  projectName: string;
  ownerId: string;
  lastActivityAt: string;
  inactiveHours: number;
}
