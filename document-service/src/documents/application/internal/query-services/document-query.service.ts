import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { Document } from '../../../domain/model/aggregates/document';
import { DocumentRequirement } from '../../../domain/model/aggregates/document-requirement';
import { DocumentVersion } from '../../../domain/model/entities/document-version';
import { GetDocumentContentQuery, GetDocumentQuery, GetMilestoneRequirementsQuery, GetProjectDocumentsQuery } from '../../../domain/model/queries/document-queries';
import { DocumentRequirementRepository } from '../../../domain/repositories/document-requirement.repository';
import { DocumentRepository } from '../../../domain/repositories/document.repository';
import { ProjectReferenceRepository } from '../../../domain/repositories/project-reference.repository';
import { FileStorage } from '../outbound-services/file-storage';

@Injectable()
export class DocumentQueryService {
  constructor(
    private readonly documents: DocumentRepository,
    private readonly requirements: DocumentRequirementRepository,
    private readonly references: ProjectReferenceRepository,
    private readonly storage: FileStorage,
  ) {}

  async handleGetByProject(q: GetProjectDocumentsQuery): Promise<Document[]> {
    if (!(await this.references.findProject(q.projectId))) throw new ResourceNotFoundError('Project', q.projectId);
    return this.documents.findByProject(q.projectId, { taskId: q.taskId, milestoneId: q.milestoneId });
  }

  async handleGet(q: GetDocumentQuery): Promise<Document> {
    const document = await this.documents.findById(q.documentId);
    if (!document) throw new ResourceNotFoundError('Document', q.documentId);
    return document;
  }

  /** US05 / US45: downloads the latest (or a given) version of a document. */
  async handleGetContent(q: GetDocumentContentQuery): Promise<{ version: DocumentVersion; data: Buffer }> {
    const document = await this.handleGet(new GetDocumentQuery(q.documentId));
    const version = document.version(q.version);
    return { version, data: await this.storage.get(version.storageKey) };
  }

  /** US21 / US49: mandatory documents of a milestone and whether each one is already uploaded. */
  async handleGetRequirements(q: GetMilestoneRequirementsQuery): Promise<DocumentRequirement[]> {
    const milestone = await this.references.findMilestone(q.milestoneId);
    if (!milestone || milestone.projectId !== q.projectId) throw new ResourceNotFoundError('Milestone', q.milestoneId);
    return this.requirements.findByMilestone(q.milestoneId);
  }
}
