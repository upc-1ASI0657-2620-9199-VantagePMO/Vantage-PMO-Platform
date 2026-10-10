import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ProjectStatus } from '../../../domain/model/value-objects/project-status';
import { MilestoneStatus } from '../../../domain/model/value-objects/milestone-status';

export class CreateProjectResource {
  @ApiProperty({ example: 'Implementación ERP Logística', maxLength: 150 })
  @IsString() @IsNotEmpty() @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'Transportes Andinos S.A.C.', maxLength: 150 })
  @IsString() @IsNotEmpty() @MaxLength(150)
  client: string;

  @ApiProperty({ example: '2026-10-12', description: 'ISO date (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2027-01-29', description: 'ISO date (YYYY-MM-DD), must not be before startDate' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ example: 85000, minimum: 0, description: 'Budget amount in PEN' })
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0)
  budget: number;
}

export class UpdateProjectResource extends CreateProjectResource {}

export class UpdateProjectStatusResource {
  @ApiProperty({ enum: ProjectStatus, example: ProjectStatus.IN_PROGRESS })
  @IsEnum(ProjectStatus)
  status: ProjectStatus;
}

export class CreateMilestoneResource {
  @ApiProperty({ example: 'Go-live del módulo de inventario' })
  @IsString() @IsNotEmpty() @MaxLength(150)
  name: string;

  @ApiProperty({ example: '2026-12-15' })
  @IsDateString()
  dueDate: string;
}

export class MilestoneResource {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty({ example: '2026-12-15' }) dueDate: string;
  @ApiProperty({ enum: MilestoneStatus }) status: MilestoneStatus;
  @ApiProperty() atRisk: boolean;
}

export class ProjectResource {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() client: string;
  @ApiProperty({ example: '2026-10-12' }) startDate: string;
  @ApiProperty({ example: '2027-01-29' }) endDate: string;
  @ApiProperty({ enum: ProjectStatus }) status: ProjectStatus;
  @ApiProperty({ example: 85000 }) budget: number;
  @ApiProperty({ example: 'PEN' }) currency: string;
  @ApiProperty() ownerId: string;
  @ApiProperty({ type: [MilestoneResource] }) milestones: MilestoneResource[];
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}

export class ProjectSummaryResource {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() client: string;
  @ApiProperty() startDate: string;
  @ApiProperty() endDate: string;
  @ApiProperty({ enum: ProjectStatus }) status: ProjectStatus;
  @ApiProperty() budget: number;
  @ApiProperty() currency: string;
  @ApiProperty({ example: 8 }) totalTasks: number;
  @ApiProperty({ example: 3 }) completedTasks: number;
  @ApiProperty({ example: 38 }) progressPercentage: number;
  @ApiProperty({ example: 1 }) milestonesAtRisk: number;
}

export class ProjectPageResource {
  @ApiProperty({ type: [ProjectSummaryResource] }) items: ProjectSummaryResource[];
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 10 }) size: number;
  @ApiProperty({ example: 23 }) totalItems: number;
  @ApiProperty({ example: 3 }) totalPages: number;
}

export class PortfolioQueryResource {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 50 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  size?: number = 10;

  @ApiPropertyOptional({ enum: ProjectStatus })
  @IsOptional() @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @ApiPropertyOptional({ description: 'Partial, case-insensitive match on client name' })
  @IsOptional() @IsString()
  client?: string;
}
