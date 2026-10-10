import { ProjectStatus } from '../value-objects/project-status';

export class GetPortfolioQuery {
  constructor(
    public readonly page = 1,
    public readonly size = 10,
    public readonly status?: ProjectStatus,
    public readonly client?: string,
  ) {}
}

export class GetProjectByIdQuery {
  constructor(public readonly projectId: string) {}
}

export class GetTasksByProjectQuery {
  constructor(public readonly projectId: string) {}
}

export class GetTaskByIdQuery {
  constructor(public readonly taskId: string) {}
}
