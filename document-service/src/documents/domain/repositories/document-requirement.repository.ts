import { DocumentRequirement } from '../model/aggregates/document-requirement';

export abstract class DocumentRequirementRepository {
  abstract save(requirement: DocumentRequirement): Promise<void>;
  abstract delete(id: string): Promise<void>;
  abstract findById(id: string): Promise<DocumentRequirement | null>;
  abstract findByMilestone(milestoneId: string): Promise<DocumentRequirement[]>;
  abstract existsByName(milestoneId: string, name: string): Promise<boolean>;
}
