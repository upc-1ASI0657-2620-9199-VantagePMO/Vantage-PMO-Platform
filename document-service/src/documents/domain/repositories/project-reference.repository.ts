import { MilestoneReference, ProjectReference } from '../model/entities/project-reference';

export abstract class ProjectReferenceRepository {
  abstract upsertProject(project: ProjectReference): Promise<void>;
  abstract upsertMilestone(milestone: MilestoneReference): Promise<void>;
  abstract findProject(id: string): Promise<ProjectReference | null>;
  abstract findMilestone(id: string): Promise<MilestoneReference | null>;
}
