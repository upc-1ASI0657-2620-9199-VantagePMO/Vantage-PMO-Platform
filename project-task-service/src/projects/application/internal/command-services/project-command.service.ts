import { Inject, Injectable, Logger } from '@nestjs/common';
import { EVENT_BUS, EventPublisher } from '@vantage-pmo/event-bus';
import { ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { Project } from '../../../domain/model/aggregates/project';
import { Milestone } from '../../../domain/model/entities/milestone';
import {
  AddMilestoneCommand,
  CompleteMilestoneCommand,
  CreateProjectCommand,
  UpdateProjectCommand,
  UpdateProjectStatusCommand,
} from '../../../domain/model/commands/project-commands';
import { MilestonePayload, ProjectEvents, ProjectSnapshotPayload } from '../../../domain/model/events/project-events';
import { MilestoneDocumentRequirementRepository } from '../../../domain/repositories/milestone-document-requirement.repository';
import { ProjectRepository } from '../../../domain/repositories/project.repository';

/** Application service that orchestrates the write use cases of the Project aggregate. */
@Injectable()
export class ProjectCommandService {
  private readonly logger = new Logger(ProjectCommandService.name);

  constructor(
    private readonly projects: ProjectRepository,
    @Inject(EVENT_BUS) private readonly events: EventPublisher,
    private readonly documentRequirements: MilestoneDocumentRequirementRepository,
  ) {}

  async handleCreate(command: CreateProjectCommand): Promise<Project> {
    const project = Project.create(command);
    await this.projects.save(project);
    await this.events.publish(ProjectEvents.PROJECT_REGISTERED, ProjectCommandService.snapshot(project));
    this.logger.log(`Project ${project.id} created by user ${command.ownerId}`);
    return project;
  }

  async handleUpdate(command: UpdateProjectCommand): Promise<Project> {
    const project = await this.load(command.projectId);
    project.updateDetails(command);
    await this.projects.save(project);
    await this.events.publish(ProjectEvents.PROJECT_UPDATED, ProjectCommandService.snapshot(project));
    return project;
  }

  async handleUpdateStatus(command: UpdateProjectStatusCommand): Promise<Project> {
    const project = await this.load(command.projectId);
    const previous = project.status;
    project.updateStatus(command.status);
    await this.projects.save(project);
    await this.events.publish(ProjectEvents.PROJECT_STATUS_CHANGED, { ...ProjectCommandService.snapshot(project), previousStatus: previous });
    this.logger.log(`Project ${project.id} status changed ${previous} -> ${project.status}`);
    return project;
  }

  async handleAddMilestone(command: AddMilestoneCommand): Promise<Milestone> {
    const project = await this.load(command.projectId);
    const milestone = project.addMilestone(command.name, command.dueDate);
    await this.projects.save(project);
    await this.events.publish(ProjectEvents.MILESTONE_ADDED, ProjectCommandService.milestonePayload(project, milestone));
    return milestone;
  }

  /** US22 / US49: completes a milestone only when all its mandatory documents were uploaded. */
  async handleCompleteMilestone(command: CompleteMilestoneCommand): Promise<Milestone> {
    const project = await this.load(command.projectId);
    const pending = await this.documentRequirements.findPendingByMilestone(command.milestoneId);
    const milestone = project.completeMilestone(command.milestoneId, pending.map((r) => r.name));
    await this.projects.save(project);
    await this.events.publish(ProjectEvents.MILESTONE_COMPLETED, ProjectCommandService.milestonePayload(project, milestone), `milestone-completed:${milestone.id}`);
    this.logger.log(`Milestone ${milestone.id} of project ${project.id} completed`);
    return milestone;
  }

  static milestonePayload(project: Project, milestone: Milestone): MilestonePayload {
    return {
      projectId: project.id, projectName: project.name, ownerId: project.ownerId,
      milestoneId: milestone.id, milestoneName: milestone.name, dueDate: milestone.dueDate, status: milestone.status,
    };
  }

  private static snapshot(project: Project): ProjectSnapshotPayload {
    return {
      projectId: project.id,
      name: project.name,
      client: project.client,
      ownerId: project.ownerId,
      status: project.status,
      startDate: project.startDate,
      endDate: project.endDate,
    };
  }

  private async load(projectId: string): Promise<Project> {
    const project = await this.projects.findById(projectId);
    if (!project) throw new ResourceNotFoundError('Project', projectId);
    return project;
  }
}
