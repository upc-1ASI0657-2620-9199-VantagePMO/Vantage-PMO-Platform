import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiCreatedResponse, ApiNoContentResponse, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthenticatedUser, CurrentUser } from '../../../shared/interfaces/rest/auth/authenticated-user';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { ensureRole, PROJECT_MANAGERS } from '../../../shared/interfaces/rest/auth/roles';
import { DocumentCommandService } from '../../application/internal/command-services/document-command.service';
import { DocumentQueryService } from '../../application/internal/query-services/document-query.service';
import { DefineRequirementCommand, RemoveRequirementCommand } from '../../domain/model/commands/document-commands';
import { GetMilestoneRequirementsQuery } from '../../domain/model/queries/document-queries';
import { CreateRequirementResource, MilestoneRequirementsResource, RequirementResource } from './resources/document.resources';
import { DocumentAssembler } from './transform/document.assembler';

@ApiTags('Mandatory documents')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller()
export class DocumentRequirementsController {
  constructor(
    private readonly commands: DocumentCommandService,
    private readonly queries: DocumentQueryService,
  ) {}

  @Post('api/v1/projects/:projectId/milestones/:milestoneId/document-requirements')
  @ApiOperation({ summary: 'Mark a document as mandatory to close a milestone (US21)' })
  @ApiCreatedResponse({ type: RequirementResource })
  @ApiResponse({ status: 403, description: 'Only ADMIN, PMO_LEAD or PROJECT_MANAGER' })
  @ApiResponse({ status: 404, description: 'Project or milestone not found' })
  @ApiResponse({ status: 409, description: 'The milestone already requires a document with that name' })
  @ApiResponse({ status: 422, description: 'Milestone already completed' })
  async define(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
    @Body() body: CreateRequirementResource,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RequirementResource> {
    ensureRole(user, PROJECT_MANAGERS);
    const requirement = await this.commands.handleDefineRequirement(new DefineRequirementCommand(projectId, milestoneId, body.name, body.description, user.id));
    return DocumentAssembler.toRequirement(requirement);
  }

  @Get('api/v1/projects/:projectId/milestones/:milestoneId/document-requirements')
  @ApiOperation({ summary: 'Mandatory documents of a milestone and which ones are still missing (US21, US49)' })
  @ApiOkResponse({ type: MilestoneRequirementsResource })
  @ApiResponse({ status: 404, description: 'Milestone not found' })
  async list(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Param('milestoneId', ParseUUIDPipe) milestoneId: string,
  ): Promise<MilestoneRequirementsResource> {
    const requirements = await this.queries.handleGetRequirements(new GetMilestoneRequirementsQuery(projectId, milestoneId));
    const missing = requirements.filter((r) => !r.fulfilled).map((r) => r.name);
    return { milestoneId, readyToClose: missing.length === 0, missing, requirements: requirements.map(DocumentAssembler.toRequirement) };
  }

  @Delete('api/v1/document-requirements/:requirementId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a mandatory document from a milestone' })
  @ApiNoContentResponse({ description: 'Requirement removed' })
  @ApiResponse({ status: 404, description: 'Requirement not found' })
  async remove(@Param('requirementId', ParseUUIDPipe) requirementId: string, @CurrentUser() user: AuthenticatedUser): Promise<void> {
    ensureRole(user, PROJECT_MANAGERS);
    await this.commands.handleRemoveRequirement(new RemoveRequirementCommand(requirementId));
  }
}
