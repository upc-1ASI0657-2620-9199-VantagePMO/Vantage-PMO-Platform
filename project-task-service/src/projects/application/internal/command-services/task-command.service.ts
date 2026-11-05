import { Inject, Injectable } from '@nestjs/common';
import { EVENT_BUS, EventPublisher } from '@vantage-pmo/event-bus';
import { DomainError, ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { Task } from '../../../domain/model/aggregates/task';
import {
  AssignTaskCommand,
  CreateTaskCommand,
  SetTaskCompletionCommand,
} from '../../../domain/model/commands/project-commands';
import { ProjectEvents, TaskAssignedPayload } from '../../../domain/model/events/project-events';
import { ProjectRepository } from '../../../domain/repositories/project.repository';
import { TaskRepository } from '../../../domain/repositories/task.repository';

/** Application service for the Task aggregate (US04, US58). */
@Injectable()
export class TaskCommandService {
  constructor(
    private readonly tasks: TaskRepository,
    private readonly projects: ProjectRepository,
    @Inject(EVENT_BUS) private readonly events: EventPublisher,
  ) {}

  async handleCreate(command: CreateTaskCommand): Promise<Task> {
    const project = await this.projects.findById(command.projectId);
    if (!project) throw new ResourceNotFoundError('Project', command.projectId);
    project.ensureOpen();
    if (command.milestoneId && !project.hasMilestone(command.milestoneId)) {
      throw new DomainError('The milestone does not belong to this project.', 'milestone-not-in-project');
    }
    const task = Task.create(command);
    await this.tasks.save(task);
    return task;
  }

  async handleAssign(command: AssignTaskCommand): Promise<Task> {
    const task = await this.load(command.taskId);
    task.assignTo(command.memberId);
    await this.tasks.save(task);
    const project = await this.projects.findById(task.projectId);
    const payload: TaskAssignedPayload = {
      taskId: task.id,
      title: task.title,
      projectId: task.projectId,
      projectName: project?.name ?? '',
      assigneeId: command.memberId,
      dueDate: task.dueDate,
    };
    await this.events.publish(ProjectEvents.TASK_ASSIGNED, payload, `task-assigned:${task.id}:${command.memberId}`);
    return task;
  }

  async handleSetCompletion(command: SetTaskCompletionCommand): Promise<Task> {
    const task = await this.load(command.taskId);
    if (command.completed) task.markComplete();
    else task.reopen();
    await this.tasks.save(task);
    return task;
  }

  private async load(taskId: string): Promise<Task> {
    const task = await this.tasks.findById(taskId);
    if (!task) throw new ResourceNotFoundError('Task', taskId);
    return task;
  }
}
