import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DocumentRequirement } from '../../../../domain/model/aggregates/document-requirement';
import { DocumentRequirementRepository } from '../../../../domain/repositories/document-requirement.repository';
import { DocumentRequirementOrmEntity } from '../entities/document-requirement.orm-entity';

@Injectable()
export class TypeOrmDocumentRequirementRepository extends DocumentRequirementRepository {
  constructor(@InjectRepository(DocumentRequirementOrmEntity) private readonly repo: Repository<DocumentRequirementOrmEntity>) {
    super();
  }

  async save(r: DocumentRequirement): Promise<void> {
    await this.repo.save(this.repo.create({
      id: r.id, projectId: r.projectId, milestoneId: r.milestoneId, name: r.name, description: r.description,
      fulfilledByDocumentId: r.fulfilledByDocumentId, definedBy: r.definedBy, createdAt: r.createdAt,
    }));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    return e ? DocumentRequirement.restore({ ...e }) : null;
  }

  async findByMilestone(milestoneId: string) {
    return (await this.repo.find({ where: { milestoneId }, order: { createdAt: 'ASC' } })).map((e) => DocumentRequirement.restore({ ...e }));
  }

  async existsByName(milestoneId: string, name: string) {
    return this.repo.exists({ where: { milestoneId, name } });
  }
}
