import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiCreatedResponse, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { AuthenticatedUser, CurrentUser } from '../../../shared/interfaces/rest/auth/authenticated-user';
import { ProjectCommandService } from '../../application/internal/command-services/project-command.service';
import { TaskCommandService } from '../../application/internal/command-services/task-command.service';
import { ProjectQueryService } from '../../application/internal/query-services/project-query.service';
import {
  AddMilestoneCommand,
  CreateProjectCommand,
  CreateTaskCommand,
  UpdateProjectCommand,
  UpdateProjectStatusCommand,
} from '../../domain/model/commands/project-commands';
import { GetPortfolioQuery, GetProjectByIdQuery, GetTasksByProjectQuery } from '../../domain/model/queries/project-queries';
import {
  CreateMilestoneResource,
  CreateProjectResource,
  MilestoneResource,
  PortfolioQueryResource,
  ProjectPageResource,
  ProjectResource,
  UpdateProjectResource,
  UpdateProjectStatusResource,
} from './resources/project.resources';
import { CreateTaskResource, TaskResource } from './resources/task.resources';
import { MilestoneResourceAssembler, ProjectResourceAssembler, TaskResourceAssembler } from './transform/assemblers';

@ApiTags('Projects')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/projects')
export class ProjectsController {
  constructor(
    private readonly commands: ProjectCommandService,
    private readonly taskCommands: TaskCommandService,
    private readonly queries: ProjectQueryService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a project with client, dates and budget (US01, US43, US46)' })
  @ApiCreatedResponse({ type: ProjectResource })
  @ApiResponse({ status: 400, description: 'Invalid payload' })
  @ApiResponse({ status: 422, description: 'Business rule violated (e.g. end date before start date)' })
  async create(@Body() body: CreateProjectResource, @CurrentUser() user: AuthenticatedUser): Promise<ProjectResource> {
    const project = await this.commands.handleCreate(
      new CreateProjectCommand(body.name, body.client, body.startDate, body.endDate, body.budget, user.id),
    );
    return ProjectResourceAssembler.toResource(project);
  }

  @Get()
  @ApiOperation({ summary: 'Get the paginated project portfolio with basic KPIs (US47, US43)' })
  @ApiOkResponse({ type: ProjectPageResource })
  getPortfolio(@Query() q: PortfolioQueryResource): Promise<ProjectPageResource> {
    return this.queries.handleGetPortfolio(new GetPortfolioQuery(q.page, q.size, q.status, q.client));
  }

  @Get(':projectId')
  @ApiOperation({ summary: 'Get a project with its milestones' })
  @ApiOkResponse({ type: ProjectResource })
  @ApiResponse({ status: 404, description: 'Project not found' })
  async getById(@Param('projectId', ParseUUIDPipe) projectId: string): Promise<ProjectResource> {
    return ProjectResourceAssembler.toResource(await this.queries.handleGetProjectById(new GetProjectByIdQuery(projectId)));
  }

  @Put(':projectId')
  @ApiOperation({ summary: 'Update project master data (client, dates, budget) (US01)' })
  @ApiOkResponse({ type: ProjectResource })
  async update(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() body: UpdateProjectResource): Promise<ProjectResource> {
    const project = await this.commands.handleUpdate(
      new UpdateProjectCommand(projectId, body.name, body.client, body.startDate, body.endDate, body.budget),
    );
    return ProjectResourceAssembler.toResource(project);
  }

  @Patch(':projectId/status')
  @HttpCode(200)
  @ApiOperation({ summary: 'Partially update the project phase following its lifecycle (US26, US48)' })
  @ApiOkResponse({ type: ProjectResource })
  @ApiResponse({ status: 422, description: 'Transition not allowed (e.g. COMPLETED -> IN_PROGRESS)' })
  async updateStatus(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: UpdateProjectStatusResource,
  ): Promise<ProjectResource> {
    return ProjectResourceAssembler.toResource(
      await this.commands.handleUpdateStatus(new UpdateProjectStatusCommand(projectId, body.status)),
    );
  }

  @Post(':projectId/milestones')
  @ApiOperation({ summary: 'Add a milestone inside the project period' })
  @ApiCreatedResponse({ type: MilestoneResource })
  async addMilestone(
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() body: CreateMilestoneResource,
  ): Promise<MilestoneResource> {
    const milestone = await this.commands.handleAddMilestone(new AddMilestoneCommand(projectId, body.name, body.dueDate));
    return MilestoneResourceAssembler.toResource(milestone);
  }

  @Post(':projectId/tasks')
  @ApiOperation({ summary: 'Create a task in the project' })
  @ApiCreatedResponse({ type: TaskResource })
  async createTask(@Param('projectId', ParseUUIDPipe) projectId: string, @Body() body: CreateTaskResource): Promise<TaskResource> {
    const task = await this.taskCommands.handleCreate(
      new CreateTaskCommand(projectId, body.title, body.description ?? null, body.priority, body.milestoneId ?? null, body.dueDate ?? null),
    );
    return TaskResourceAssembler.toResource(task);
  }

  @Get(':projectId/tasks')
  @ApiOperation({ summary: 'List the tasks of a project' })
  @ApiOkResponse({ type: [TaskResource] })
  async getTasks(@Param('projectId', ParseUUIDPipe) projectId: string): Promise<TaskResource[]> {
    const tasks = await this.queries.handleGetTasksByProject(new GetTasksByProjectQuery(projectId));
    return tasks.map(TaskResourceAssembler.toResource);
  }
}
