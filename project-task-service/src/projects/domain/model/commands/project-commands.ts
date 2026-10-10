import { ProjectStatus } from '../value-objects/project-status';
import { Priority } from '../value-objects/priority';

export class CreateProjectCommand {
  constructor(
    public readonly name: string,
    public readonly client: string,
    public readonly startDate: string,
    public readonly endDate: string,
    public readonly budget: number,
    public readonly ownerId: string,
  ) {}
}

export class UpdateProjectCommand {
  constructor(
    public readonly projectId: string,
    public readonly name: string,
    public readonly client: string,
    public readonly startDate: string,
    public readonly endDate: string,
    public readonly budget: number,
  ) {}
}

export class UpdateProjectStatusCommand {
  constructor(public readonly projectId: string, public readonly status: ProjectStatus) {}
}

export class AddMilestoneCommand {
  constructor(public readonly projectId: string, public readonly name: string, public readonly dueDate: string) {}
}

export class CreateTaskCommand {
  constructor(
    public readonly projectId: string,
    public readonly title: string,
    public readonly description: string | null,
    public readonly priority: Priority | undefined,
    public readonly milestoneId: string | null,
    public readonly dueDate: string | null,
  ) {}
}

export class AssignTaskCommand {
  constructor(public readonly taskId: string, public readonly memberId: string) {}
}

export class SetTaskCompletionCommand {
  constructor(public readonly taskId: string, public readonly completed: boolean) {}
}
