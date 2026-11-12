import { Inject, Injectable, Logger } from '@nestjs/common';
import { EVENT_BUS, EventPublisher } from '@vantage-pmo/event-bus';
import { ConflictError, DomainError, ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { Document } from '../../../domain/model/aggregates/document';
import { DocumentRequirement } from '../../../domain/model/aggregates/document-requirement';
import { DocumentVersion } from '../../../domain/model/entities/document-version';
import { DefineRequirementCommand, RemoveRequirementCommand, UploadDocumentCommand } from '../../../domain/model/commands/document-commands';
import { DocumentEvents, DocumentUploadedPayload, RequirementPayload } from '../../../domain/model/events/document-events';
import { DocumentRequirementRepository } from '../../../domain/repositories/document-requirement.repository';
import { DocumentRepository } from '../../../domain/repositories/document.repository';
import { ProjectReferenceRepository } from '../../../domain/repositories/project-reference.repository';
import { FileStorage } from '../outbound-services/file-storage';

export interface UploadResult {
  document: Document;
  version: DocumentVersion;
  createdNewDocument: boolean;
  fulfilledRequirement: DocumentRequirement | null;
}

/** Write use cases of Document Management (US45, US05, US35, US21). */
@Injectable()
export class DocumentCommandService {
  private readonly logger = new Logger(DocumentCommandService.name);

  constructor(
    private readonly documents: DocumentRepository,
    private readonly requirements: DocumentRequirementRepository,
    private readonly references: ProjectReferenceRepository,
    private readonly storage: FileStorage,
    @Inject(EVENT_BUS) private readonly events: EventPublisher,
  ) {}

  async handleUpload(command: UploadDocumentCommand): Promise<UploadResult> {
    const project = await this.references.findProject(command.projectId);
    if (!project) throw new ResourceNotFoundError('Project', command.projectId);

    let requirement: DocumentRequirement | null = null;
    let milestoneId = command.milestoneId ?? null;
    if (command.requirementId) {
      requirement = await this.requirements.findById(command.requirementId);
      if (!requirement || requirement.projectId !== project.id) throw new ResourceNotFoundError('DocumentRequirement', command.requirementId);
      if (milestoneId && milestoneId !== requirement.milestoneId) {
        throw new DomainError('The requirement belongs to another milestone.', 'requirement-milestone-mismatch');
      }
      milestoneId = requirement.milestoneId;
    }
    if (milestoneId) {
      const milestone = await this.references.findMilestone(milestoneId);
      if (!milestone || milestone.projectId !== project.id) throw new ResourceNotFoundError('Milestone', milestoneId);
    }
    const taskId = command.taskId ?? null;
    const name = (command.name ?? requirement?.name ?? command.file.fileName).trim();

    // US35: the same logical document (name + attachment) gets a new version.
    let document = await this.documents.findByName(project.id, name, taskId, milestoneId);
    const createdNewDocument = !document;
    let version: DocumentVersion;
    if (document) {
      version = document.addVersion(command.file, command.uploadedBy);
    } else {
      document = Document.create({ projectId: project.id, name, taskId, milestoneId, requirementId: requirement?.id ?? null, file: command.file, uploadedBy: command.uploadedBy });
      version = document.latestVersion!;
    }
    if (requirement && !document.requirementId) document.linkRequirement(requirement.id);

    await this.storage.put(version.storageKey, command.file.data, version.contentType);
    await this.documents.save(document);

    const uploaded: DocumentUploadedPayload = {
      documentId: document.id, projectId: project.id, projectName: project.name, ownerId: project.ownerId, name: document.name,
      version: version.number, taskId, milestoneId, uploadedBy: command.uploadedBy,
    };
    await this.events.publish(DocumentEvents.DOCUMENT_UPLOADED, uploaded, `document-uploaded:${document.id}:${version.number}`);

    let fulfilledRequirement: DocumentRequirement | null = null;
    if (requirement && requirement.fulfill(document.id)) {
      await this.requirements.save(requirement);
      await this.events.publish(DocumentEvents.REQUIREMENT_FULFILLED, DocumentCommandService.requirementPayload(requirement), `requirement-fulfilled:${requirement.id}`);
      fulfilledRequirement = requirement;
    }
    this.logger.log(`Document ${document.id} v${version.number} uploaded to project ${project.id}`);
    return { document, version, createdNewDocument, fulfilledRequirement };
  }

  /** US21: marks a document as mandatory to close a milestone. */
  async handleDefineRequirement(command: DefineRequirementCommand): Promise<DocumentRequirement> {
    const project = await this.references.findProject(command.projectId);
    if (!project) throw new ResourceNotFoundError('Project', command.projectId);
    const milestone = await this.references.findMilestone(command.milestoneId);
    if (!milestone || milestone.projectId !== project.id) throw new ResourceNotFoundError('Milestone', command.milestoneId);
    if (milestone.status === 'COMPLETED') throw new DomainError(`Milestone '${milestone.name}' is already completed.`, 'milestone-already-completed');
    const requirement = DocumentRequirement.define(command);
    if (await this.requirements.existsByName(milestone.id, requirement.name)) {
      throw new ConflictError(`Milestone '${milestone.name}' already requires a document named '${requirement.name}'.`, 'duplicated-requirement');
    }
    await this.requirements.save(requirement);
    await this.events.publish(DocumentEvents.REQUIREMENT_DEFINED, DocumentCommandService.requirementPayload(requirement), `requirement-defined:${requirement.id}`);
    return requirement;
  }

  async handleRemoveRequirement(command: RemoveRequirementCommand): Promise<void> {
    const requirement = await this.requirements.findById(command.requirementId);
    if (!requirement) throw new ResourceNotFoundError('DocumentRequirement', command.requirementId);
    await this.requirements.delete(requirement.id);
    await this.events.publish(DocumentEvents.REQUIREMENT_REMOVED, DocumentCommandService.requirementPayload(requirement), `requirement-removed:${requirement.id}`);
  }

  static requirementPayload(r: DocumentRequirement): RequirementPayload {
    return { requirementId: r.id, projectId: r.projectId, milestoneId: r.milestoneId, name: r.name, fulfilled: r.fulfilled, documentId: r.fulfilledByDocumentId };
  }
}
