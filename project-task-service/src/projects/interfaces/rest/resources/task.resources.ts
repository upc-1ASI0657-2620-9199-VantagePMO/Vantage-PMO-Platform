import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { Priority } from '../../../domain/model/value-objects/priority';
import { TaskStatus } from '../../../domain/model/value-objects/task-status';

export class CreateTaskResource {
  @ApiProperty({ example: 'Levantar requerimientos con el área de almacén', maxLength: 200 })
  @IsString() @IsNotEmpty() @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Entrevistas con jefe de almacén y supervisores de turno' })
  @IsOptional() @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: Priority, default: Priority.MEDIUM })
  @IsOptional() @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({ description: 'Milestone of the same project the task contributes to' })
  @IsOptional() @IsUUID()
  milestoneId?: string;

  @ApiPropertyOptional({ example: '2026-10-30' })
  @IsOptional() @IsDateString()
  dueDate?: string;
}

export class AssignTaskResource {
  @ApiProperty({ description: 'Id of the team member (IAM user id) responsible for the task' })
  @IsUUID()
  memberId: string;
}

export class TaskCompletionResource {
  @ApiProperty({ example: true, description: 'true marks the task as DONE; false re-opens it' })
  @IsBoolean()
  completed: boolean;
}

export class TaskResource {
  @ApiProperty() id: string;
  @ApiProperty() projectId: string;
  @ApiProperty({ nullable: true }) milestoneId: string | null;
  @ApiProperty() title: string;
  @ApiProperty({ nullable: true }) description: string | null;
  @ApiProperty({ enum: TaskStatus }) status: TaskStatus;
  @ApiProperty({ enum: Priority }) priority: Priority;
  @ApiProperty({ nullable: true }) assignedTo: string | null;
  @ApiProperty({ nullable: true }) dueDate: string | null;
  @ApiProperty({ nullable: true }) completedAt: string | null;
  @ApiProperty() createdAt: string;
  @ApiProperty() updatedAt: string;
}
