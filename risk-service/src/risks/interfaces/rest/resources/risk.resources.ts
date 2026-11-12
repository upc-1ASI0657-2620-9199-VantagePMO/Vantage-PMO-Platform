import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { RiskLevel } from '../../../domain/model/value-objects/risk-score';
import { RiskCategory, RiskStatus } from '../../../domain/model/value-objects/risk-status';

export class CreateRiskResource {
  @ApiProperty({ example: 'Retraso del proveedor de lectores RFID', maxLength: 150 })
  @IsString() @IsNotEmpty() @MaxLength(150)
  title: string;

  @ApiPropertyOptional({ example: 'El proveedor confirmó que la entrega podría pasar a enero.' })
  @IsOptional() @IsString() @MaxLength(2000)
  description?: string;

  @ApiProperty({ enum: RiskCategory, example: RiskCategory.EXTERNAL })
  @IsEnum(RiskCategory)
  category: RiskCategory;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5, description: '1 = muy baja … 5 = muy alta' })
  @IsInt() @Min(1) @Max(5)
  probability: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5, description: '1 = muy bajo … 5 = muy alto' })
  @IsInt() @Min(1) @Max(5)
  impact: number;

  @ApiPropertyOptional({ format: 'uuid', description: 'Team member responsible for the risk' })
  @IsOptional() @IsUUID()
  responsibleId?: string;

  @ApiPropertyOptional({ example: 'Cotizar un segundo proveedor y adelantar la configuración con equipos de prueba.' })
  @IsOptional() @IsString() @MaxLength(2000)
  mitigationPlan?: string;
}

export class ReassessRiskResource {
  @ApiProperty({ example: 2, minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) probability: number;
  @ApiProperty({ example: 4, minimum: 1, maximum: 5 }) @IsInt() @Min(1) @Max(5) impact: number;
  @ApiPropertyOptional({ example: 'El segundo proveedor confirmó stock.' }) @IsOptional() @IsString() @MaxLength(300) note?: string;
}

export class ChangeRiskStatusResource {
  @ApiProperty({ enum: RiskStatus, example: RiskStatus.MITIGATING }) @IsEnum(RiskStatus) status: RiskStatus;
  @ApiPropertyOptional({ example: 'Cotizar un segundo proveedor.', description: 'Required to move to MITIGATING when the risk has no plan' })
  @IsOptional() @IsString() @MaxLength(2000)
  mitigationPlan?: string;
}

export class ProjectRisksQueryResource {
  @ApiPropertyOptional({ enum: RiskStatus }) @IsOptional() @IsEnum(RiskStatus) status?: RiskStatus;
  @ApiPropertyOptional({ enum: RiskLevel, description: 'Only risks at or above this level' }) @IsOptional() @IsEnum(RiskLevel) minLevel?: RiskLevel;
}

export class PriorityRisksQueryResource {
  @ApiPropertyOptional({ enum: RiskLevel, example: RiskLevel.HIGH, description: 'Minimum severity (default HIGH)' })
  @IsOptional() @IsEnum(RiskLevel)
  minLevel?: RiskLevel;
}

export class RiskAssessmentResource {
  @ApiProperty({ example: 2 }) number: number;
  @ApiProperty({ example: 2 }) probability: number;
  @ApiProperty({ example: 4 }) impact: number;
  @ApiProperty({ example: 8 }) score: number;
  @ApiProperty({ enum: RiskLevel, example: RiskLevel.MEDIUM }) level: RiskLevel;
  @ApiPropertyOptional({ example: 'El segundo proveedor confirmó stock.', nullable: true }) note: string | null;
  @ApiProperty({ format: 'uuid' }) assessedBy: string;
  @ApiProperty({ example: '2026-11-12T16:20:00.000Z' }) assessedAt: string;
}

export class RiskResource {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ format: 'uuid' }) projectId: string;
  @ApiPropertyOptional({ example: 'Implementación ERP Logística' }) projectName?: string;
  @ApiProperty({ example: 'Retraso del proveedor de lectores RFID' }) title: string;
  @ApiPropertyOptional({ nullable: true }) description: string | null;
  @ApiProperty({ enum: RiskCategory }) category: RiskCategory;
  @ApiProperty({ enum: RiskStatus }) status: RiskStatus;
  @ApiProperty({ example: 4 }) probability: number;
  @ApiProperty({ example: 5 }) impact: number;
  @ApiProperty({ example: 20, description: 'probability x impact (1-25)' }) score: number;
  @ApiProperty({ enum: RiskLevel, example: RiskLevel.CRITICAL }) level: RiskLevel;
  @ApiProperty({ example: true, description: 'Open critical risk: shown highlighted at the top (US30)' }) highlighted: boolean;
  @ApiPropertyOptional({ format: 'uuid', nullable: true }) responsibleId: string | null;
  @ApiPropertyOptional({ nullable: true }) mitigationPlan: string | null;
  @ApiProperty({ example: '2026-11-12T16:00:00.000Z' }) updatedAt: string;
}

export class RiskDetailResource extends RiskResource {
  @ApiProperty({ type: [RiskAssessmentResource] }) assessments: RiskAssessmentResource[];
}
