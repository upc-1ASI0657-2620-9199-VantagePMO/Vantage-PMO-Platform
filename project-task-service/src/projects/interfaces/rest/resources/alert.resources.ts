import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsISO8601, IsOptional } from 'class-validator';

export class RunAlertScanResource {
  @ApiPropertyOptional({ example: '2026-11-08T12:00:00Z', description: 'Reference instant of the scan (defaults to now). Useful for demos and tests.' })
  @IsOptional()
  @IsISO8601()
  asOf?: string;
}

class AlertEventResource {
  @ApiProperty({ example: 'projects.milestone-due-soon' }) type: string;
  @ApiProperty({ example: 'milestone-due-soon:5b0d…:2026-11-09' }) key: string;
  @ApiProperty({ format: 'uuid' }) projectId: string;
}

export class AlertScanResultResource {
  @ApiProperty({ example: '2026-11-08T12:00:00.000Z' }) asOf: string;
  @ApiProperty({ example: 1 }) milestonesDueSoon: number;
  @ApiProperty({ example: 2 }) stalledProjects: number;
  @ApiProperty({ type: [AlertEventResource] }) events: AlertEventResource[];
}
