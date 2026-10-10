import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { User } from '../../../domain/model/aggregates/user';
import { GetAllUsersQuery, GetUserByIdQuery } from '../../../domain/model/queries/iam-queries';
import { UserRepository } from '../../../domain/repositories/user.repository';

@Injectable()
export class UserQueryService {
  constructor(private readonly users: UserRepository) {}

  handleGetAll(_query: GetAllUsersQuery): Promise<User[]> {
    return this.users.findAll();
  }

  async handleGetById(query: GetUserByIdQuery): Promise<User> {
    const user = await this.users.findById(query.userId);
    if (!user) throw new ResourceNotFoundError('User', query.userId);
    return user;
  }
}
