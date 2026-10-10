import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../shared/interfaces/rest/auth/jwt-auth.guard';
import { TaskCommandService } from '../../application/internal/command-services/task-command.service';
import { ProjectQueryService } from '../../application/internal/query-services/project-query.service';
import { AssignTaskCommand, SetTaskCompletionCommand } from '../../domain/model/commands/project-commands';
import { GetTaskByIdQuery } from '../../domain/model/queries/project-queries';
import { AssignTaskResource, TaskCompletionResource, TaskResource } from './resources/task.resources';
import { TaskResourceAssembler } from './transform/assemblers';

@ApiTags('Tasks')
@ApiBearerAuth()
@ApiResponse({ status: 401, description: 'Missing or invalid JWT' })
@UseGuards(JwtAuthGuard)
@Controller('api/v1/tasks')
export class TasksController {
  constructor(
    private readonly commands: TaskCommandService,
    private readonly queries: ProjectQueryService,
  ) {}

  @Get(':taskId')
  @ApiOperation({ summary: 'Get a task by id' })
  @ApiOkResponse({ type: TaskResource })
  @ApiResponse({ status: 404, description: 'Task not found' })
  async getById(@Param('taskId', ParseUUIDPipe) taskId: string): Promise<TaskResource> {
    return TaskResourceAssembler.toResource(await this.queries.handleGetTaskById(new GetTaskByIdQuery(taskId)));
  }

  @Patch(':taskId/assignee')
  @HttpCode(200)
  @ApiOperation({ summary: 'Assign a responsible member to the task (US04)' })
  @ApiOkResponse({ type: TaskResource })
  @ApiResponse({ status: 422, description: 'A completed task cannot be reassigned' })
  async assign(@Param('taskId', ParseUUIDPipe) taskId: string, @Body() body: AssignTaskResource): Promise<TaskResource> {
    return TaskResourceAssembler.toResource(await this.commands.handleAssign(new AssignTaskCommand(taskId, body.memberId)));
  }

  @Patch(':taskId/completion')
  @HttpCode(200)
  @ApiOperation({ summary: 'Mark a task as completed or re-open it with a single action (US58)' })
  @ApiOkResponse({ type: TaskResource })
  async setCompletion(@Param('taskId', ParseUUIDPipe) taskId: string, @Body() body: TaskCompletionResource): Promise<TaskResource> {
    return TaskResourceAssembler.toResource(
      await this.commands.handleSetCompletion(new SetTaskCompletionCommand(taskId, body.completed)),
    );
  }
}
