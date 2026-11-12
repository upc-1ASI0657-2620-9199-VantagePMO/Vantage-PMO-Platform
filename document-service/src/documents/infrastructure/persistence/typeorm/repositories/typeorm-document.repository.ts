import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Document } from '../../../../domain/model/aggregates/document';
import { DocumentRepository } from '../../../../domain/repositories/document.repository';
import { DocumentOrmEntity, DocumentVersionOrmEntity } from '../entities/document.orm-entity';

const toDomain = (e: DocumentOrmEntity) =>
  Document.restore({
    id: e.id, projectId: e.projectId, name: e.name, taskId: e.taskId, milestoneId: e.milestoneId, requirementId: e.requirementId,
    createdAt: e.createdAt,
    versions: (e.versions ?? []).map((v) => ({
      number: v.number, fileName: v.fileName, contentType: v.contentType, sizeBytes: v.sizeBytes, checksum: v.checksum,
      storageKey: v.storageKey, uploadedBy: v.uploadedBy, uploadedAt: v.uploadedAt,
    })),
  });

@Injectable()
export class TypeOrmDocumentRepository extends DocumentRepository {
  constructor(@InjectRepository(DocumentOrmEntity) private readonly repo: Repository<DocumentOrmEntity>) {
    super();
  }

  async save(d: Document): Promise<void> {
    await this.repo.save(this.repo.create({
      id: d.id, projectId: d.projectId, name: d.name, taskId: d.taskId, milestoneId: d.milestoneId, requirementId: d.requirementId,
      createdAt: d.createdAt,
      versions: d.versions.map((v) => Object.assign(new DocumentVersionOrmEntity(), { ...v, documentId: d.id })),
    }));
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    return e ? toDomain(e) : null;
  }

  async findByName(projectId: string, name: string, taskId: string | null, milestoneId: string | null) {
    const e = await this.repo.findOne({
      where: { projectId, name, taskId: taskId ?? IsNull(), milestoneId: milestoneId ?? IsNull() },
    });
    return e ? toDomain(e) : null;
  }

  async findByProject(projectId: string, filter: { taskId?: string; milestoneId?: string }) {
    const where: Record<string, unknown> = { projectId };
    if (filter.taskId) where.taskId = filter.taskId;
    if (filter.milestoneId) where.milestoneId = filter.milestoneId;
    return (await this.repo.find({ where, order: { name: 'ASC' } })).map(toDomain);
  }
}
