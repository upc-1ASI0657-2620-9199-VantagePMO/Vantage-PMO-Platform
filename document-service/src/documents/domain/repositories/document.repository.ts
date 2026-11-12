import { Document } from '../model/aggregates/document';

export abstract class DocumentRepository {
  abstract save(document: Document): Promise<void>;
  abstract findById(id: string): Promise<Document | null>;
  /** Same logical document: same project, name and attachment (task or milestone). */
  abstract findByName(projectId: string, name: string, taskId: string | null, milestoneId: string | null): Promise<Document | null>;
  abstract findByProject(projectId: string, filter: { taskId?: string; milestoneId?: string }): Promise<Document[]>;
}
