import { randomUUID } from 'crypto';
import { DomainError } from '../../../../shared/domain/domain-error';
import { AllocationPercentage } from '../value-objects/allocation-percentage';
import { DateRange } from '../value-objects/date-range';

interface ResourceAllocationProps {
  id: string;
  projectId: string;
  memberId: string;
  role: string;
  percentage: AllocationPercentage;
  period: DateRange;
  assignedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Aggregate root of Resource Management (US14): a member works for a project with a share of
 * time during a period. It replaces the intermediate table project_members of the monolith.
 */
export class ResourceAllocation {
  private constructor(private props: ResourceAllocationProps) {}

  static create(params: {
    projectId: string; memberId: string; role: string; percentage: number;
    startDate: string; endDate: string; assignedBy: string;
  }): ResourceAllocation {
    const now = new Date();
    return new ResourceAllocation({
      id: randomUUID(),
      projectId: params.projectId,
      memberId: params.memberId,
      role: ResourceAllocation.validRole(params.role),
      percentage: AllocationPercentage.of(params.percentage),
      period: DateRange.of(params.startDate, params.endDate),
      assignedBy: params.assignedBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  static restore(props: Omit<ResourceAllocationProps, 'percentage' | 'period'> & { percentage: number; startDate: string; endDate: string }) {
    const { startDate, endDate, percentage, ...rest } = props;
    return new ResourceAllocation({ ...rest, percentage: AllocationPercentage.of(percentage), period: DateRange.of(startDate, endDate) });
  }

  change(params: { role?: string; percentage?: number; startDate?: string; endDate?: string }): void {
    if (params.role !== undefined) this.props.role = ResourceAllocation.validRole(params.role);
    if (params.percentage !== undefined) this.props.percentage = AllocationPercentage.of(params.percentage);
    if (params.startDate !== undefined || params.endDate !== undefined) {
      this.props.period = DateRange.of(params.startDate ?? this.startDate, params.endDate ?? this.endDate);
    }
    this.props.updatedAt = new Date();
  }

  overlaps(period: DateRange): boolean {
    return this.props.period.overlaps(period);
  }

  private static validRole(role: string): string {
    const value = (role ?? '').trim();
    if (!value) throw new DomainError('The role of the member in the project is required.', 'role-required');
    if (value.length > 80) throw new DomainError('The role must have at most 80 characters.', 'role-too-long');
    return value;
  }

  get id() { return this.props.id; }
  get projectId() { return this.props.projectId; }
  get memberId() { return this.props.memberId; }
  get role() { return this.props.role; }
  get percentage() { return this.props.percentage.value; }
  get period() { return this.props.period; }
  get startDate() { return this.props.period.startDate; }
  get endDate() { return this.props.period.endDate; }
  get assignedBy() { return this.props.assignedBy; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}
