import { ProjectStatus } from '../model/value-objects/project-status';

/** Read Model (CQRS-lite): denormalized view of a project used by the portfolio (US47). */
export interface ProjectSummary {
  id: string;
  name: string;
  client: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  budget: number;
  currency: string;
  totalTasks: number;
  completedTasks: number;
  progressPercentage: number;
  milestonesAtRisk: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
}

export abstract class ProjectSummaryReader {
  abstract findPage(criteria: { page: number; size: number; status?: ProjectStatus; client?: string }): Promise<Page<ProjectSummary>>;
}
