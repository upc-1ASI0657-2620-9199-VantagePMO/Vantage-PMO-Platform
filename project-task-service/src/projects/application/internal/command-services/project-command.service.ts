import { Injectable, Logger } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { Project } from '../../../domain/model/aggregates/project';
import { Milestone } from '../../../domain/model/entities/milestone';
import {
  AddMilestoneCommand,
  CreateProjectCommand,
  UpdateProjectCommand,
  UpdateProjectStatusCommand,
} from '../../../domain/model/commands/project-commands';
import { ProjectRepository } from '../../../domain/repositories/project.repository';

/** Application service that orchestrates the write use cases of the Project aggregate. */
@Injectable()
export class ProjectCommandService {
  private readonly logger = new Logger(ProjectCommandService.name);

  constructor(private readonly projects: ProjectRepository) {}

  async handleCreate(command: CreateProjectCommand): Promise<Project> {
    const project = Project.create(command);
    await this.projects.save(project);
    this.logger.log(`Project ${project.id} created by user ${command.ownerId}`);
    return project;
  }

  async handleUpdate(command: UpdateProjectCommand): Promise<Project> {
    const project = await this.load(command.projectId);
    project.updateDetails(command);
    await this.projects.save(project);
    return project;
  }

  async handleUpdateStatus(command: UpdateProjectStatusCommand): Promise<Project> {
    const project = await this.load(command.projectId);
    const previous = project.status;
    project.updateStatus(command.status);
    await this.projects.save(project);
    this.logger.log(`Project ${project.id} status changed ${previous} -> ${project.status}`);
    return project;
  }

  async handleAddMilestone(command: AddMilestoneCommand): Promise<Milestone> {
    const project = await this.load(command.projectId);
    const milestone = project.addMilestone(command.name, command.dueDate);
    await this.projects.save(project);
    return milestone;
  }

  private async load(projectId: string): Promise<Project> {
    const project = await this.projects.findById(projectId);
    if (!project) throw new ResourceNotFoundError('Project', projectId);
    return project;
  }
}
