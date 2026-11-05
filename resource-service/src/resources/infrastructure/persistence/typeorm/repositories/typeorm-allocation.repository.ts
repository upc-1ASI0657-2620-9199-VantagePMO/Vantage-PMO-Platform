import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Repository } from 'typeorm';
import { ResourceAllocation } from '../../../../domain/model/aggregates/resource-allocation';
import { AllocationRepository } from '../../../../domain/repositories/allocation.repository';
import { AllocationOrmEntity } from '../entities/allocation.orm-entity';

const toDomain = (e: AllocationOrmEntity) =>
  ResourceAllocation.restore({
    id: e.id, projectId: e.projectId, memberId: e.memberId, role: e.role, percentage: e.percentage,
    startDate: e.startDate, endDate: e.endDate, assignedBy: e.assignedBy, createdAt: e.createdAt, updatedAt: e.updatedAt,
  });

@Injectable()
export class TypeOrmAllocationRepository extends AllocationRepository {
  constructor(@InjectRepository(AllocationOrmEntity) private readonly repo: Repository<AllocationOrmEntity>) {
    super();
  }

  async save(a: ResourceAllocation): Promise<void> {
    await this.repo.save(this.repo.create({
      id: a.id, projectId: a.projectId, memberId: a.memberId, role: a.role, percentage: a.percentage,
      startDate: a.startDate, endDate: a.endDate, assignedBy: a.assignedBy, createdAt: a.createdAt,
    }));
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    return e ? toDomain(e) : null;
  }

  async findByProjectId(projectId: string) {
    return (await this.repo.find({ where: { projectId }, order: { startDate: 'ASC' } })).map(toDomain);
  }

  async findByMemberId(memberId: string) {
    return (await this.repo.find({ where: { memberId }, order: { startDate: 'ASC' } })).map(toDomain);
  }

  async findOverlapping(from: string, to: string) {
    return (await this.repo.find({ where: { startDate: LessThanOrEqual(to), endDate: MoreThanOrEqual(from) } })).map(toDomain);
  }
}
