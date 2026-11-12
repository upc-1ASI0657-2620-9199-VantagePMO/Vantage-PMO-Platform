import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MilestoneDocumentRequirement } from '../../../../domain/model/entities/milestone-document-requirement';
import { MilestoneDocumentRequirementRepository } from '../../../../domain/repositories/milestone-document-requirement.repository';
import { MilestoneDocumentRequirementOrmEntity } from '../entities/milestone-document-requirement.orm-entity';

@Injectable()
export class TypeOrmMilestoneDocumentRequirementRepository extends MilestoneDocumentRequirementRepository {
  constructor(@InjectRepository(MilestoneDocumentRequirementOrmEntity) private readonly repo: Repository<MilestoneDocumentRequirementOrmEntity>) {
    super();
  }

  async upsert(r: MilestoneDocumentRequirement): Promise<void> {
    await this.repo.upsert({ ...r }, ['requirementId']);
  }

  async markFulfilled(requirementId: string): Promise<void> {
    await this.repo.update({ requirementId }, { fulfilled: true });
  }

  async remove(requirementId: string): Promise<void> {
    await this.repo.delete({ requirementId });
  }

  async findPendingByMilestone(milestoneId: string): Promise<MilestoneDocumentRequirement[]> {
    const rows = await this.repo.find({ where: { milestoneId, fulfilled: false }, order: { name: 'ASC' } });
    return rows.map(({ syncedAt: _s, ...r }) => r);
  }
}
