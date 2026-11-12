import { randomUUID } from 'crypto';
import { ConflictError, DomainError } from '../../../../shared/domain/domain-error';
import { DocumentVersion } from '../entities/document-version';
import { FileContent } from '../value-objects/file-content';

interface DocumentProps {
  id: string;
  projectId: string;
  name: string;
  taskId: string | null;
  milestoneId: string | null;
  requirementId: string | null;
  versions: DocumentVersion[];
  createdAt: Date;
}

/**
 * Aggregate root of Document Management (US45, US05, US35): a logical document of a project,
 * optionally attached to a task or a milestone, with the history of its uploaded versions.
 */
export class Document {
  private constructor(private props: DocumentProps) {}

  static create(params: {
    projectId: string; name: string; taskId?: string | null; milestoneId?: string | null; requirementId?: string | null;
    file: FileContent; uploadedBy: string;
  }): Document {
    const name = (params.name ?? '').trim();
    if (!name) throw new DomainError('The document name is required.', 'document-name-required');
    if (name.length > 150) throw new DomainError('The document name must have at most 150 characters.', 'document-name-too-long');
    const document = new Document({
      id: randomUUID(),
      projectId: params.projectId,
      name,
      taskId: params.taskId ?? null,
      milestoneId: params.milestoneId ?? null,
      requirementId: params.requirementId ?? null,
      versions: [],
      createdAt: new Date(),
    });
    document.addVersion(params.file, params.uploadedBy);
    return document;
  }

  static restore(props: DocumentProps): Document {
    return new Document({ ...props, versions: [...props.versions].sort((a, b) => a.number - b.number) });
  }

  /**
   * US35: uploading a file with the same document name creates a new version instead of
   * overwriting the previous one. Uploading exactly the same content again is rejected.
   */
  addVersion(file: FileContent, uploadedBy: string): DocumentVersion {
    const latest = this.latestVersion;
    if (latest && latest.checksum === file.checksum) {
      throw new ConflictError(`The file is identical to version ${latest.number} of '${this.props.name}'.`, 'duplicate-document-content');
    }
    const number = (latest?.number ?? 0) + 1;
    const version: DocumentVersion = {
      number,
      fileName: file.fileName,
      contentType: file.contentType,
      sizeBytes: file.size,
      checksum: file.checksum,
      storageKey: `${this.props.id}/v${number}`,
      uploadedBy,
      uploadedAt: new Date(),
    };
    this.props.versions.push(version);
    return version;
  }

  /** Links the document to a mandatory requirement of a milestone (US21). */
  linkRequirement(requirementId: string): void {
    this.props.requirementId = requirementId;
  }

  version(number?: number): DocumentVersion {
    const v = number === undefined ? this.latestVersion : this.props.versions.find((x) => x.number === number);
    if (!v) throw new DomainError(`Version ${number} of '${this.props.name}' does not exist.`, 'version-not-found');
    return v;
  }

  get latestVersion(): DocumentVersion | undefined {
    return this.props.versions[this.props.versions.length - 1];
  }

  get id() { return this.props.id; }
  get projectId() { return this.props.projectId; }
  get name() { return this.props.name; }
  get taskId() { return this.props.taskId; }
  get milestoneId() { return this.props.milestoneId; }
  get requirementId() { return this.props.requirementId; }
  get versions(): readonly DocumentVersion[] { return this.props.versions; }
  get createdAt() { return this.props.createdAt; }
}
