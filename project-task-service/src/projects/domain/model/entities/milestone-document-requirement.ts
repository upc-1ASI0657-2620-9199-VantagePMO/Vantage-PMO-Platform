/**
 * Local replica of a mandatory document defined in the Document context for a milestone.
 * Project & Task only needs to know whether it is fulfilled to allow closing the milestone.
 */
export interface MilestoneDocumentRequirement {
  requirementId: string;
  projectId: string;
  milestoneId: string;
  name: string;
  fulfilled: boolean;
}
