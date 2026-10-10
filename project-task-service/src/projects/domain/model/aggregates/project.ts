import { randomUUID } from 'crypto';
import { DomainError } from '../../../../shared/domain/domain-error';
import { Milestone } from '../entities/milestone';
import { DateRange } from '../value-objects/date-range';
import { Money } from '../value-objects/money';
import { isClosedStatus, PROJECT_STATUS_TRANSITIONS, ProjectStatus } from '../value-objects/project-status';

export interface ProjectProps {
  id: string;
  name: string;
  client: string;
  period: DateRange;
  status: ProjectStatus;
  budget: Money;
  ownerId: string;
  milestones: Milestone[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate Root of the Project & Task Management bounded context.
 * Guards the invariants of a project and of its milestones (US01, US26, US43).
 */
export class Project {
  private constructor(private props: ProjectProps) {}

  static create(params: {
    name: string;
    client: string;
    startDate: string;
    endDate: string;
    budget: number;
    ownerId: string;
  }): Project {
    const now = new Date();
    return new Project({
      id: randomUUID(),
      name: Project.requireText(params.name, 'name', 150),
      client: Project.requireText(params.client, 'client', 150),
      period: DateRange.of(params.startDate, params.endDate),
      status: ProjectStatus.PLANNED,
      budget: Money.of(params.budget),
      ownerId: params.ownerId,
      milestones: [],
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Rebuilds an aggregate from persistence without re-running creation rules. */
  static restore(props: ProjectProps): Project {
    return new Project(props);
  }

  get id(): string { return this.props.id; }
  get name(): string { return this.props.name; }
  get client(): string { return this.props.client; }
  get startDate(): string { return this.props.period.startDate; }
  get endDate(): string { return this.props.period.endDate; }
  get status(): ProjectStatus { return this.props.status; }
  get budget(): number { return this.props.budget.amount; }
  get currency(): string { return this.props.budget.currency; }
  get ownerId(): string { return this.props.ownerId; }
  get milestones(): readonly Milestone[] { return this.props.milestones; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }
  get isClosed(): boolean { return isClosedStatus(this.props.status); }

  /** Updates master data of the project (client, dates, budget). */
  updateDetails(params: { name: string; client: string; startDate: string; endDate: string; budget: number }): void {
    this.ensureOpen();
    const period = DateRange.of(params.startDate, params.endDate);
    const outOfRange = this.props.milestones.find((m) => !period.contains(m.dueDate));
    if (outOfRange) {
      throw new DomainError(`Milestone '${outOfRange.name}' would fall outside the new project period.`, 'milestone-out-of-range');
    }
    this.props.name = Project.requireText(params.name, 'name', 150);
    this.props.client = Project.requireText(params.client, 'client', 150);
    this.props.period = period;
    this.props.budget = Money.of(params.budget);
    this.touch();
  }

  /** Moves the project to another phase following the lifecycle state machine (US26 / US48). */
  updateStatus(newStatus: ProjectStatus): void {
    if (newStatus === this.props.status) return;
    const allowed = PROJECT_STATUS_TRANSITIONS[this.props.status];
    if (!allowed.includes(newStatus)) {
      throw new DomainError(
        `Cannot change project status from ${this.props.status} to ${newStatus}.`,
        'invalid-status-transition',
      );
    }
    this.props.status = newStatus;
    this.touch();
  }

  /** Adds a milestone whose due date must be inside the project period. */
  addMilestone(name: string, dueDate: string): Milestone {
    this.ensureOpen();
    const milestone = Milestone.create(this.props.id, name, dueDate);
    if (!this.props.period.contains(milestone.dueDate)) {
      throw new DomainError('The milestone due date must be within the project period.', 'milestone-out-of-range');
    }
    this.props.milestones.push(milestone);
    this.touch();
    return milestone;
  }

  hasMilestone(milestoneId: string): boolean {
    return this.props.milestones.some((m) => m.id === milestoneId);
  }

  ensureOpen(): void {
    if (this.isClosed) {
      throw new DomainError(`Project is ${this.props.status} and can no longer be modified.`, 'project-closed');
    }
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private static requireText(value: string, field: string, max: number): string {
    const text = (value ?? '').trim();
    if (!text) throw new DomainError(`The project ${field} is required.`, 'invalid-project');
    if (text.length > max) throw new DomainError(`The project ${field} cannot exceed ${max} characters.`, 'invalid-project');
    return text;
  }
}
