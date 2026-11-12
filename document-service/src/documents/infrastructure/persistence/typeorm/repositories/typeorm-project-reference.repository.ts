import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MilestoneReference, ProjectReference } from '../../../../domain/model/entities/project-reference';
import { ProjectReferenceRepository } from '../../../../domain/repositories/project-reference.repository';
import { MilestoneReferenceOrmEntity, ProjectReferenceOrmEntity } from '../entities/reference.orm-entity';

@Injectable()
export class TypeOrmProjectReferenceRepository extends ProjectReferenceRepository {
  constructor(
    @InjectRepository(ProjectReferenceOrmEntity) private readonly projects: Repository<ProjectReferenceOrmEntity>,
    @InjectRepository(MilestoneReferenceOrmEntity) private readonly milestones: Repository<MilestoneReferenceOrmEntity>,
  ) {
    super();
  }

  async upsertProject(p: ProjectReference) { await this.projects.upsert({ ...p }, ['id']); }
  async upsertMilestone(m: MilestoneReference) { await this.milestones.upsert({ ...m }, ['id']); }

  async findProject(id: string): Promise<ProjectReference | null> {
    const e = await this.projects.findOne({ where: { id } });
    return e ? { id: e.id, name: e.name, ownerId: e.ownerId, status: e.status } : null;
  }

  async findMilestone(id: string): Promise<MilestoneReference | null> {
    const e = await this.milestones.findOne({ where: { id } });
    return e ? { id: e.id, projectId: e.projectId, name: e.name, status: e.status } : null;
  }
}
