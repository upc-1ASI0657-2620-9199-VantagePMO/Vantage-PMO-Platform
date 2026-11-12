import { ProjectReference } from '../model/entities/project-reference';

export abstract class ProjectReferenceRepository {
  abstract upsert(project: ProjectReference): Promise<void>;
  abstract findById(id: string): Promise<ProjectReference | null>;
  abstract findByIds(ids: string[]): Promise<ProjectReference[]>;
}
