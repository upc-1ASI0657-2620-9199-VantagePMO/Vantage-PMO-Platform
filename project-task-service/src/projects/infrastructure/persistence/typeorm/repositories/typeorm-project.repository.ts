import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../../../../domain/model/aggregates/project';
import { ProjectRepository } from '../../../../domain/repositories/project.repository';
import { ProjectOrmEntity } from '../entities/project.orm-entity';
import { ProjectMapper } from './project-mapper';

@Injectable()
export class TypeOrmProjectRepository extends ProjectRepository {
  constructor(@InjectRepository(ProjectOrmEntity) private readonly repo: Repository<ProjectOrmEntity>) {
    super();
  }

  async save(project: Project): Promise<void> {
    await this.repo.save(ProjectMapper.toOrm(project));
  }

  async findById(id: string): Promise<Project | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? ProjectMapper.toDomain(entity) : null;
  }

  async existsById(id: string): Promise<boolean> {
    return this.repo.exists({ where: { id } });
  }
}
