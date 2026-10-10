import { Project } from '../../../../domain/model/aggregates/project';
import { Milestone } from '../../../../domain/model/entities/milestone';
import { Task } from '../../../../domain/model/aggregates/task';
import { DateRange } from '../../../../domain/model/value-objects/date-range';
import { Money } from '../../../../domain/model/value-objects/money';
import { MilestoneStatus } from '../../../../domain/model/value-objects/milestone-status';
import { ProjectStatus } from '../../../../domain/model/value-objects/project-status';
import { Priority } from '../../../../domain/model/value-objects/priority';
import { TaskStatus } from '../../../../domain/model/value-objects/task-status';
import { ProjectOrmEntity } from '../entities/project.orm-entity';
import { MilestoneOrmEntity } from '../entities/milestone.orm-entity';
import { TaskOrmEntity } from '../entities/task.orm-entity';

/** Data Mapper between the persistence model (TypeORM) and the domain model. */
export class ProjectMapper {
  static toDomain(e: ProjectOrmEntity): Project {
    return Project.restore({
      id: e.id,
      name: e.name,
      client: e.client,
      period: DateRange.of(e.startDate, e.endDate),
      status: e.status as ProjectStatus,
      budget: Money.of(Number(e.budget), e.currency),
      ownerId: e.ownerId,
      milestones: (e.milestones ?? [])
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .map((m) => new Milestone(m.id, e.id, m.name, m.dueDate, m.status as MilestoneStatus)),
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    });
  }

  static toOrm(p: Project): ProjectOrmEntity {
    const e = new ProjectOrmEntity();
    e.id = p.id;
    e.name = p.name;
    e.client = p.client;
    e.startDate = p.startDate;
    e.endDate = p.endDate;
    e.status = p.status;
    e.budget = p.budget.toFixed(2);
    e.currency = p.currency;
    e.ownerId = p.ownerId;
    e.milestones = p.milestones.map((m) => {
      const me = new MilestoneOrmEntity();
      me.id = m.id;
      me.projectId = p.id;
      me.name = m.name;
      me.dueDate = m.dueDate;
      me.status = m.status;
      return me;
    });
    return e;
  }
}

export class TaskMapper {
  static toDomain(e: TaskOrmEntity): Task {
    return Task.restore({
      id: e.id,
      projectId: e.projectId,
      milestoneId: e.milestoneId,
      title: e.title,
      description: e.description,
      status: e.status as TaskStatus,
      priority: e.priority as Priority,
      assignedTo: e.assignedTo,
      dueDate: e.dueDate,
      completedAt: e.completedAt,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    });
  }

  static toOrm(t: Task): TaskOrmEntity {
    const e = new TaskOrmEntity();
    e.id = t.id;
    e.projectId = t.projectId;
    e.milestoneId = t.milestoneId;
    e.title = t.title;
    e.description = t.description;
    e.status = t.status;
    e.priority = t.priority;
    e.assignedTo = t.assignedTo;
    e.dueDate = t.dueDate;
    e.completedAt = t.completedAt;
    return e;
  }
}
