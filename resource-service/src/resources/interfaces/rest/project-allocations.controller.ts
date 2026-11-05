import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../../../shared/interfaces/rest/auth/authenticated-user';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { ensureRole, RESOURCE_MANAGERS } from '../../../shared/interfaces/rest/auth/roles';
import { AllocationCommandService } from '../../application/internal/command-services/allocation-command.service';
import { ResourceQueryService } from '../../application/internal/query-services/resource-query.service';
import { AllocateMemberCommand } from '../../domain/model/commands/resource-commands';
import { GetAllocationsByProjectQuery } from '../../domain/model/queries/resource-queries';
import { AllocationResource, AllocationResultResource, CreateAllocationResource } from './resources/allocation.resources';
import { AllocationAssembler } from './transform/allocation.assembler';

@ApiTags('Allocations')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects/:projectId/allocations')
export class ProjectAllocationsController {
  constructor(
    private readonly commands: AllocationCommandService,
    private readonly queries: ResourceQueryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Allocate a team member to a project with a role and a share of time (US14)' })
  @ApiCreatedResponse({ type: AllocationResultResource })
  @ApiResponse({ status: 403, description: 'Only ADMIN, PMO_LEAD or PROJECT_MANAGER' })
  @ApiResponse({ status: 404, description: 'Member or project not found' })
  @ApiResponse({ status: 422, description: 'Project closed, period outside the project or duplicated allocation' })
  async allocate(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: CreateAllocationResource,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AllocationResultResource> {
    ensureRole(user, RESOURCE_MANAGERS);
    const result = await this.commands.handleAllocate(
      new AllocateMemberCommand(projectId, body.memberId, body.role, body.percentage, body.startDate, body.endDate, user.id),
    );
    return AllocationAssembler.toResult(result);
  }

  @Get()
  @ApiOperation({ summary: 'List the team allocated to a project (US14)' })
  @ApiOkResponse({ type: [AllocationResource] })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async list(@Param('projectId', ParseUUIDPipe) projectId: string): Promise<AllocationResource[]> {
    const { allocations, members } = await this.queries.handleGetByProject(new GetAllocationsByProjectQuery(projectId));
    return allocations.map((a) => AllocationAssembler.toResource(a, members.get(a.memberId)?.fullName));
  }
}
