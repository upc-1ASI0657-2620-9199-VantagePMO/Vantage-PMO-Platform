import { Project } from '../model/aggregates/project';
import { ProjectStatus } from '../model/value-objects/project-status';

/** Port (Repository pattern): the domain depends on this abstraction, not on TypeORM. */
export abstract class ProjectRepository {
  abstract save(project: Project): Promise<void>;
  abstract findById(id: string): Promise<Project | null>;
  abstract existsById(id: string): Promise<boolean>;
}

export interface ProjectSearchCriteria {
  status?: ProjectStatus;
  client?: string;
  page: number;
  size: number;
}
