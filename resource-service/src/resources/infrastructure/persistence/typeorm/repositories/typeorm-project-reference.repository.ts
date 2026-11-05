import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ProjectReference } from '../../../../domain/model/entities/project-reference';
import { ProjectReferenceRepository } from '../../../../domain/repositories/project-reference.repository';
import { ProjectReferenceOrmEntity } from '../entities/project-reference.orm-entity';

const toDomain = (e: ProjectReferenceOrmEntity): ProjectReference => ({
  id: e.id, name: e.name, ownerId: e.ownerId, status: e.status, startDate: e.startDate, endDate: e.endDate,
});

@Injectable()
export class TypeOrmProjectReferenceRepository extends ProjectReferenceRepository {
  constructor(@InjectRepository(ProjectReferenceOrmEntity) private readonly repo: Repository<ProjectReferenceOrmEntity>) {
    super();
  }

  async upsert(p: ProjectReference): Promise<void> {
    await this.repo.upsert({ ...p }, ['id']);
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    return e ? toDomain(e) : null;
  }

  async findByIds(ids: string[]) {
    if (!ids.length) return [];
    return (await this.repo.find({ where: { id: In(ids) } })).map(toDomain);
  }
}
