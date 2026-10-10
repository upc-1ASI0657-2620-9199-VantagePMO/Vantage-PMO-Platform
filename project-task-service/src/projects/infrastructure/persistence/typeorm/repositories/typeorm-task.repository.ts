import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../../../../domain/model/aggregates/task';
import { TaskRepository } from '../../../../domain/repositories/task.repository';
import { TaskOrmEntity } from '../entities/task.orm-entity';
import { TaskMapper } from './project-mapper';

@Injectable()
export class TypeOrmTaskRepository extends TaskRepository {
  constructor(@InjectRepository(TaskOrmEntity) private readonly repo: Repository<TaskOrmEntity>) {
    super();
  }

  async save(task: Task): Promise<void> {
    await this.repo.save(TaskMapper.toOrm(task));
  }

  async findById(id: string): Promise<Task | null> {
    const entity = await this.repo.findOne({ where: { id } });
    return entity ? TaskMapper.toDomain(entity) : null;
  }

  async findByProjectId(projectId: string): Promise<Task[]> {
    const entities = await this.repo.find({ where: { projectId }, order: { createdAt: 'ASC' } });
    return entities.map(TaskMapper.toDomain);
  }
}
