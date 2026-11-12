/** Events consumed from Project & Task and published by Document Management. */
export const ConsumedEvents = {
  PROJECT_REGISTERED: 'projects.project-registered',
  PROJECT_UPDATED: 'projects.project-updated',
  PROJECT_STATUS_CHANGED: 'projects.project-status-changed',
  MILESTONE_ADDED: 'projects.milestone-added',
  MILESTONE_COMPLETED: 'projects.milestone-completed',
} as const;

export const DocumentEvents = {
  DOCUMENT_UPLOADED: 'documents.document-uploaded',
  REQUIREMENT_DEFINED: 'documents.requirement-defined',
  REQUIREMENT_FULFILLED: 'documents.requirement-fulfilled',
  REQUIREMENT_REMOVED: 'documents.requirement-removed',
} as const;

export interface DocumentUploadedPayload {
  documentId: string;
  projectId: string;
  projectName: string;
  ownerId: string;
  name: string;
  version: number;
  taskId: string | null;
  milestoneId: string | null;
  uploadedBy: string;
}

export interface RequirementPayload {
  requirementId: string;
  projectId: string;
  milestoneId: string;
  name: string;
  fulfilled: boolean;
  documentId?: string | null;
}
