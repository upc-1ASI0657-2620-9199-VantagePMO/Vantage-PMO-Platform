export interface MilestoneAlertCandidate {
  projectId: string;
  projectName: string;
  ownerId: string;
  milestoneId: string;
  milestoneName: string;
  dueDate: string;
  status: string;
}

export interface ProjectActivity {
  projectId: string;
  projectName: string;
  ownerId: string;
  status: string;
  lastActivityAt: Date;
}

/** Read port used by the scheduled alert scan (US09, US10, US53). */
export abstract class ProjectAlertReader {
  /** Pending milestones of open projects with a due date in [from, to] (calendar days). */
  abstract findPendingMilestonesDueBetween(from: string, to: string): Promise<MilestoneAlertCandidate[]>;
  /** Open projects with the last change of the project or any of its tasks. */
  abstract findOpenProjectsActivity(): Promise<ProjectActivity[]>;
  abstract findAllSnapshots(): Promise<{ id: string; name: string; client: string; ownerId: string; status: string; startDate: string; endDate: string }[]>;
}
