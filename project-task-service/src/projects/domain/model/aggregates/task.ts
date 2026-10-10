import { randomUUID } from 'crypto';
import { DomainError } from '../../../../shared/domain/domain-error';
import { Priority } from '../value-objects/priority';
import { TaskStatus } from '../value-objects/task-status';

export interface TaskProps {
  id: string;
  projectId: string;
  milestoneId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  assignedTo: string | null;
  dueDate: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate Root for a unit of work inside a project. It references its Project
 * by identity only, so tasks can be updated concurrently without locking the project.
 */
export class Task {
  private constructor(private props: TaskProps) {}

  static create(params: {
    projectId: string;
    milestoneId?: string | null;
    title: string;
    description?: string | null;
    priority?: Priority;
    dueDate?: string | null;
  }): Task {
    const title = (params.title ?? '').trim();
    if (!title) throw new DomainError('The task title is required.', 'invalid-task');
    if (title.length > 200) throw new DomainError('The task title cannot exceed 200 characters.', 'invalid-task');
    const now = new Date();
    return new Task({
      id: randomUUID(),
      projectId: params.projectId,
      milestoneId: params.milestoneId ?? null,
      title,
      description: params.description?.trim() || null,
      status: TaskStatus.TODO,
      priority: params.priority ?? Priority.MEDIUM,
      assignedTo: null,
      dueDate: params.dueDate ? new Date(params.dueDate).toISOString().substring(0, 10) : null,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: TaskProps): Task {
    return new Task(props);
  }

  get id(): string { return this.props.id; }
  get projectId(): string { return this.props.projectId; }
  get milestoneId(): string | null { return this.props.milestoneId; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description; }
  get status(): TaskStatus { return this.props.status; }
  get priority(): Priority { return this.props.priority; }
  get assignedTo(): string | null { return this.props.assignedTo; }
  get dueDate(): string | null { return this.props.dueDate; }
  get completedAt(): Date | null { return this.props.completedAt; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  /** Assigns (or re-assigns) the member responsible for the task (US04). */
  assignTo(memberId: string): void {
    if (this.props.status === TaskStatus.DONE) {
      throw new DomainError('A completed task cannot be reassigned.', 'task-completed');
    }
    this.props.assignedTo = memberId;
    if (this.props.status === TaskStatus.TODO) this.props.status = TaskStatus.IN_PROGRESS;
    this.touch();
  }

  /** Marks the task as done with a single action (US58). Idempotent. */
  markComplete(): void {
    if (this.props.status === TaskStatus.DONE) return;
    this.props.status = TaskStatus.DONE;
    this.props.completedAt = new Date();
    this.touch();
  }

  /** Re-opens a completed task (unchecking the checkbox). */
  reopen(): void {
    if (this.props.status !== TaskStatus.DONE) return;
    this.props.status = this.props.assignedTo ? TaskStatus.IN_PROGRESS : TaskStatus.TODO;
    this.props.completedAt = null;
    this.touch();
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }
}
