import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { AvailabilityStatus } from '../../../domain/model/value-objects/availability-status';

export class CreateAllocationResource {
  @ApiProperty({ format: 'uuid', description: 'Team member (user id issued by IAM)' })
  @IsUUID()
  memberId: string;

  @ApiProperty({ example: 'Analista funcional', maxLength: 80 })
  @IsString() @IsNotEmpty() @MaxLength(80)
  role: string;

  @ApiProperty({ example: 50, minimum: 1, maximum: 100, description: 'Share of the member working time (%)' })
  @IsInt() @Min(1) @Max(100)
  percentage: number;

  @ApiProperty({ example: '2026-11-09' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2026-12-18' })
  @IsDateString()
  endDate: string;
}

export class UpdateAllocationResource extends PartialType(OmitType(CreateAllocationResource, ['memberId'] as const)) {}

export class AllocationResource {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) projectId: string;
  @ApiProperty({ format: 'uuid' }) memberId: string;
  @ApiPropertyOptional({ example: 'Lucía Torres' }) memberName?: string;
  @ApiProperty({ example: 'Analista funcional' }) role: string;
  @ApiProperty({ example: 50 }) percentage: number;
  @ApiProperty({ example: '2026-11-09' }) startDate: string;
  @ApiProperty({ example: '2026-12-18' }) endDate: string;
  @ApiProperty({ format: 'uuid' }) assignedBy: string;
}

export class AllocationResultResource extends AllocationResource {
  @ApiProperty({ example: 80, description: 'Total load of the member in the allocation period (%)' }) memberTotalAllocation: number;
  @ApiProperty({ example: false, description: 'true when the member exceeds 100 % (the project owner is notified)' }) overallocated: boolean;
}

export class AvailabilityQueryResource {
  @ApiPropertyOptional({ example: '2026-11-09', description: 'Start of the period (default: today)' })
  @IsOptional() @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-09', description: 'End of the period (default: from + 30 days)' })
  @IsOptional() @IsDateString()
  to?: string;

  @ApiPropertyOptional({ example: 20, minimum: 0, maximum: 100, description: 'Only members with at least this free capacity' })
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100)
  minAvailable?: number;
}

class MemberAllocationSummary {
  @ApiProperty({ format: 'uuid' }) allocationId: string;
  @ApiProperty({ format: 'uuid' }) projectId: string;
  @ApiProperty({ example: 'Implementación ERP Logística' }) projectName: string;
  @ApiProperty({ example: 'Analista funcional' }) role: string;
  @ApiProperty({ example: 50 }) percentage: number;
  @ApiProperty({ example: '2026-11-09' }) startDate: string;
  @ApiProperty({ example: '2026-12-18' }) endDate: string;
}

export class MemberAvailabilityResource {
  @ApiProperty({ format: 'uuid' }) memberId: string;
  @ApiProperty({ example: 'Lucía Torres' }) fullName: string;
  @ApiProperty({ example: 'lucia.torres@vantage.pe' }) email: string;
  @ApiProperty({ example: 'MEMBER' }) role: string;
  @ApiProperty({ example: 50 }) allocatedPercentage: number;
  @ApiProperty({ example: 50 }) availablePercentage: number;
  @ApiProperty({ enum: AvailabilityStatus, example: AvailabilityStatus.PARTIAL }) status: AvailabilityStatus;
  @ApiProperty({ type: [MemberAllocationSummary] }) allocations: MemberAllocationSummary[];
}

export class AvailabilityResource {
  @ApiProperty({ example: '2026-11-09' }) from: string;
  @ApiProperty({ example: '2026-12-09' }) to: string;
  @ApiProperty({ type: [MemberAvailabilityResource] }) members: MemberAvailabilityResource[];
}
