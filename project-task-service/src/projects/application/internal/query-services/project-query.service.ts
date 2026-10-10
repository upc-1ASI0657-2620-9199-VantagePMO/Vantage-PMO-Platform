import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { Project } from '../../../domain/model/aggregates/project';
import { Task } from '../../../domain/model/aggregates/task';
import {
  GetPortfolioQuery,
  GetProjectByIdQuery,
  GetTaskByIdQuery,
  GetTasksByProjectQuery,
} from '../../../domain/model/queries/project-queries';
import { ProjectRepository } from '../../../domain/repositories/project.repository';
import { Page, ProjectSummary, ProjectSummaryReader } from '../../../domain/repositories/project-summary.reader';
import { TaskRepository } from '../../../domain/repositories/task.repository';

/** Read side of the bounded context (CQRS-lite). */
@Injectable()
export class ProjectQueryService {
  constructor(
    private readonly projects: ProjectRepository,
    private readonly tasks: TaskRepository,
    private readonly summaries: ProjectSummaryReader,
  ) {}

  handleGetPortfolio(query: GetPortfolioQuery): Promise<Page<ProjectSummary>> {
    return this.summaries.findPage(query);
  }

  async handleGetProjectById(query: GetProjectByIdQuery): Promise<Project> {
    const project = await this.projects.findById(query.projectId);
    if (!project) throw new ResourceNotFoundError('Project', query.projectId);
    return project;
  }

  async handleGetTasksByProject(query: GetTasksByProjectQuery): Promise<Task[]> {
    if (!(await this.projects.existsById(query.projectId))) throw new ResourceNotFoundError('Project', query.projectId);
    return this.tasks.findByProjectId(query.projectId);
  }

  async handleGetTaskById(query: GetTaskByIdQuery): Promise<Task> {
    const task = await this.tasks.findById(query.taskId);
    if (!task) throw new ResourceNotFoundError('Task', query.taskId);
    return task;
  }
}
