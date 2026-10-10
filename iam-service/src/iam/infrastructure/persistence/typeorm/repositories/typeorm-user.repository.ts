import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../../domain/model/aggregates/user';
import { EmailAddress } from '../../../../domain/model/value-objects/email-address';
import { Role } from '../../../../domain/model/value-objects/role';
import { UserRepository } from '../../../../domain/repositories/user.repository';
import { UserOrmEntity } from '../entities/user.orm-entity';

@Injectable()
export class TypeOrmUserRepository extends UserRepository {
  constructor(@InjectRepository(UserOrmEntity) private readonly repo: Repository<UserOrmEntity>) {
    super();
  }

  async save(user: User): Promise<void> {
    await this.repo.save({
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      passwordHash: user.passwordHash,
      role: user.role,
      createdAt: user.createdAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const e = await this.repo.findOne({ where: { id } });
    return e ? TypeOrmUserRepository.toDomain(e) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const e = await this.repo.findOne({ where: { email } });
    return e ? TypeOrmUserRepository.toDomain(e) : null;
  }

  existsByEmail(email: string): Promise<boolean> {
    return this.repo.exists({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return (await this.repo.find({ order: { createdAt: 'ASC' } })).map(TypeOrmUserRepository.toDomain);
  }

  private static toDomain(e: UserOrmEntity): User {
    return User.restore({
      id: e.id,
      fullName: e.fullName,
      email: EmailAddress.of(e.email),
      passwordHash: e.passwordHash,
      role: e.role as Role,
      createdAt: e.createdAt,
    });
  }
}
