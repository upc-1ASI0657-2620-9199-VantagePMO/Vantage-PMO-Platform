import { randomUUID } from 'crypto';
import { DomainError } from '../../../../shared/domain/domain-error';
import { MilestoneStatus } from '../value-objects/milestone-status';
import { DateRange } from '../value-objects/date-range';

/** Entity that lives inside the Project aggregate (no lifecycle outside of a project). */
export class Milestone {
  constructor(
    public readonly id: string,
    public readonly projectId: string,
    public name: string,
    public dueDate: string,
    public status: MilestoneStatus,
  ) {}

  static create(projectId: string, name: string, dueDate: string): Milestone {
    if (!name || !name.trim()) throw new DomainError('The milestone name is required.', 'invalid-milestone');
    return new Milestone(randomUUID(), projectId, name.trim(), DateRange.normalize(dueDate, 'dueDate'), MilestoneStatus.PENDING);
  }

  complete(): void {
    this.status = MilestoneStatus.COMPLETED;
  }

  /** A pending milestone is at risk when its due date is within the next 3 days or already passed. */
  isAtRisk(today: Date = new Date()): boolean {
    if (this.status === MilestoneStatus.COMPLETED) return false;
    const limit = new Date(today);
    limit.setUTCDate(limit.getUTCDate() + 3);
    return this.dueDate <= limit.toISOString().substring(0, 10);
  }
}
