import { Controller, Get, Param, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../../../shared/interfaces/rest/auth/authenticated-user';
import { UserQueryService } from '../../application/internal/query-services/user-query.service';
import { GetAllUsersQuery, GetUserByIdQuery } from '../../domain/model/queries/iam-queries';
import { UserResource } from './resources/iam.resources';
import { UserResourceAssembler } from './transform/user-resource.assembler';

@ApiTags('Users')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly queries: UserQueryService) {}

  @Get()
  @ApiOperation({ summary: 'List registered users (team members that can be assigned to tasks)' })
  @ApiOkResponse({ type: [UserResource] })
  async getAll(): Promise<UserResource[]> {
    return (await this.queries.handleGetAll(new GetAllUsersQuery())).map(UserResourceAssembler.toResource);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get the profile of the authenticated user' })
  @ApiOkResponse({ type: UserResource })
  async me(@CurrentUser() current: AuthenticatedUser): Promise<UserResource> {
    return UserResourceAssembler.toResource(await this.queries.handleGetById(new GetUserByIdQuery(current.id)));
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiOkResponse({ type: UserResource })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getById(@Param('userId', ParseUUIDPipe) userId: string): Promise<UserResource> {
    return UserResourceAssembler.toResource(await this.queries.handleGetById(new GetUserByIdQuery(userId)));
  }
}
