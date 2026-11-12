import { UploadResult } from '../../../application/internal/command-services/document-command.service';
import { Document } from '../../../domain/model/aggregates/document';
import { DocumentRequirement } from '../../../domain/model/aggregates/document-requirement';
import { DocumentResource, RequirementResource, UploadResultResource } from '../resources/document.resources';

export class DocumentAssembler {
  static toResource(d: Document): DocumentResource {
    const base = `/api/v1/documents/${d.id}/content`;
    return {
      id: d.id, projectId: d.projectId, name: d.name, taskId: d.taskId, milestoneId: d.milestoneId, requirementId: d.requirementId,
      latestVersion: d.latestVersion?.number ?? 0,
      downloadUrl: base,
      versions: d.versions.map((v) => ({
        number: v.number, fileName: v.fileName, contentType: v.contentType, sizeBytes: v.sizeBytes, checksum: v.checksum,
        uploadedBy: v.uploadedBy, uploadedAt: new Date(v.uploadedAt).toISOString(), downloadUrl: `${base}?version=${v.number}`,
      })),
    };
  }

  static toUploadResult(r: UploadResult): UploadResultResource {
    return { ...DocumentAssembler.toResource(r.document), createdNewDocument: r.createdNewDocument, fulfilledRequirementId: r.fulfilledRequirement?.id ?? null };
  }

  static toRequirement(r: DocumentRequirement): RequirementResource {
    return {
      id: r.id, projectId: r.projectId, milestoneId: r.milestoneId, name: r.name, description: r.description,
      fulfilled: r.fulfilled, documentId: r.fulfilledByDocumentId,
    };
  }
}
