import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../../../../domain/model/entities/member';
import { MemberRepository } from '../../../../domain/repositories/member.repository';
import { MemberOrmEntity } from '../entities/member.orm-entity';

@Injectable()
export class TypeOrmMemberRepository extends MemberRepository {
  constructor(@InjectRepository(MemberOrmEntity) private readonly repo: Repository<MemberOrmEntity>) {
    super();
  }

  async upsert(m: Member): Promise<void> {
    await this.repo.upsert({ id: m.id, fullName: m.fullName, email: m.email, role: m.role }, ['id']);
  }

  async findById(id: string): Promise<Member | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? { id: e.id, fullName: e.fullName, email: e.email, role: e.role } : null;
  }

  async findAll(): Promise<Member[]> {
    return (await this.repo.find({ order: { fullName: 'ASC' } })).map((e) => ({ id: e.id, fullName: e.fullName, email: e.email, role: e.role }));
  }
}
