import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';
import { NotificationType } from '../../../domain/model/value-objects/notification-type';

export class NotificationQueryResource {
  @ApiPropertyOptional({ example: true, description: 'Only unread notifications' })
  @IsOptional() @Transform(({ value }) => value === true || value === 'true') @IsBoolean()
  unread?: boolean;

  @ApiPropertyOptional({ example: 1, minimum: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 20, minimum: 1, maximum: 100 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100)
  size?: number;
}

export class NotificationResource {
  @ApiProperty({ format: 'uuid' }) id: string;
  @ApiProperty({ enum: NotificationType, example: NotificationType.MILESTONE_DUE_SOON }) type: NotificationType;
  @ApiProperty({ example: 'El hito "Go-live" vence pronto' }) title: string;
  @ApiProperty({ example: 'El hito "Go-live" del proyecto ERP Logística vence el 09/11/2026 (menos de 24 horas).' }) message: string;
  @ApiPropertyOptional({ example: '/projects/5b0d7a1e-…' }) link: string | null;
  @ApiProperty({ example: false }) read: boolean;
  @ApiPropertyOptional({ example: null }) readAt: string | null;
  @ApiProperty({ example: '2026-11-08T12:00:03.000Z' }) createdAt: string;
}

export class NotificationPageResource {
  @ApiProperty({ type: [NotificationResource] }) items: NotificationResource[];
  @ApiProperty({ example: 1 }) page: number;
  @ApiProperty({ example: 20 }) size: number;
  @ApiProperty({ example: 3 }) totalItems: number;
}

export class UnreadCountResource {
  @ApiProperty({ example: 2 }) unread: number;
  @ApiProperty({ example: true, description: 'Shows the red dot of the bell (US63)' }) hasUnread: boolean;
}

export class MarkAllReadResultResource {
  @ApiProperty({ example: 2 }) updated: number;
}
