import { Project } from '../../../domain/model/aggregates/project';
import { Task } from '../../../domain/model/aggregates/task';
import { Milestone } from '../../../domain/model/entities/milestone';
import { MilestoneResource, ProjectResource } from '../resources/project.resources';
import { TaskResource } from '../resources/task.resources';

/** Assemblers translate domain objects into REST resources (Anti-Corruption Layer). */
export class MilestoneResourceAssembler {
  static toResource(m: Milestone): MilestoneResource {
    return { id: m.id, name: m.name, dueDate: m.dueDate, status: m.status, atRisk: m.isAtRisk() };
  }
}

export class ProjectResourceAssembler {
  static toResource(p: Project): ProjectResource {
    return {
      id: p.id,
      name: p.name,
      client: p.client,
      startDate: p.startDate,
      endDate: p.endDate,
      status: p.status,
      budget: p.budget,
      currency: p.currency,
      ownerId: p.ownerId,
      milestones: p.milestones.map(MilestoneResourceAssembler.toResource),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}

export class TaskResourceAssembler {
  static toResource(t: Task): TaskResource {
    return {
      id: t.id,
      projectId: t.projectId,
      milestoneId: t.milestoneId,
      title: t.title,
      description: t.description,
      status: t.status,
      priority: t.priority,
      assignedTo: t.assignedTo,
      dueDate: t.dueDate,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    };
  }
}
