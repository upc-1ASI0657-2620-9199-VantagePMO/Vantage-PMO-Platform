import { randomUUID } from 'crypto';
import { DomainError } from '../../../../shared/domain/domain-error';

interface DocumentRequirementProps {
  id: string;
  projectId: string;
  milestoneId: string;
  name: string;
  description: string | null;
  fulfilledByDocumentId: string | null;
  definedBy: string;
  createdAt: Date;
}

/**
 * Aggregate root (US21): a document that must exist before a milestone can be closed.
 * It is fulfilled when a document is uploaded against it.
 */
export class DocumentRequirement {
  private constructor(private props: DocumentRequirementProps) {}

  static define(params: { projectId: string; milestoneId: string; name: string; description?: string | null; definedBy: string }): DocumentRequirement {
    const name = (params.name ?? '').trim();
    if (!name) throw new DomainError('The name of the mandatory document is required.', 'requirement-name-required');
    if (name.length > 150) throw new DomainError('The name must have at most 150 characters.', 'requirement-name-too-long');
    return new DocumentRequirement({
      id: randomUUID(), projectId: params.projectId, milestoneId: params.milestoneId, name,
      description: params.description?.trim() || null, fulfilledByDocumentId: null, definedBy: params.definedBy, createdAt: new Date(),
    });
  }

  static restore(props: DocumentRequirementProps): DocumentRequirement {
    return new DocumentRequirement({ ...props });
  }

  /** Returns true only the first time the requirement becomes fulfilled. */
  fulfill(documentId: string): boolean {
    if (this.props.fulfilledByDocumentId) return false;
    this.props.fulfilledByDocumentId = documentId;
    return true;
  }

  get id() { return this.props.id; }
  get projectId() { return this.props.projectId; }
  get milestoneId() { return this.props.milestoneId; }
  get name() { return this.props.name; }
  get description() { return this.props.description; }
  get fulfilled() { return this.props.fulfilledByDocumentId !== null; }
  get fulfilledByDocumentId() { return this.props.fulfilledByDocumentId; }
  get definedBy() { return this.props.definedBy; }
  get createdAt() { return this.props.createdAt; }
}
