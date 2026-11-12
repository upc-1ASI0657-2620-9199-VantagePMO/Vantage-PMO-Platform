import { MilestoneDocumentRequirement } from '../model/entities/milestone-document-requirement';

export abstract class MilestoneDocumentRequirementRepository {
  abstract upsert(requirement: MilestoneDocumentRequirement): Promise<void>;
  abstract markFulfilled(requirementId: string): Promise<void>;
  abstract remove(requirementId: string): Promise<void>;
  abstract findPendingByMilestone(milestoneId: string): Promise<MilestoneDocumentRequirement[]>;
}
