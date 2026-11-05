import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationCommandService } from './application/internal/command-services/notification-command.service';
import { DomainEventsHandler } from './application/internal/event-handlers/domain-events.handler';
import { NOTIFICATION_CHANNELS } from './application/internal/outbound-services/notification-channel';
import { NotificationQueryService } from './application/internal/query-services/notification-query.service';
import { NotificationRepository } from './domain/repositories/notification.repository';
import { InAppChannel } from './infrastructure/channels/in-app.channel';
import { LogEmailChannel } from './infrastructure/channels/log-email.channel';
import { NotificationOrmEntity } from './infrastructure/persistence/typeorm/entities/notification.orm-entity';
import { TypeOrmNotificationRepository } from './infrastructure/persistence/typeorm/repositories/typeorm-notification.repository';
import { NotificationsController } from './interfaces/rest/notifications.controller';

/** Notification bounded context wiring: consumers, channels (Strategy) and REST API. */
@Module({
  imports: [TypeOrmModule.forFeature([NotificationOrmEntity])],
  controllers: [NotificationsController],
  providers: [
    NotificationCommandService,
    NotificationQueryService,
    DomainEventsHandler,
    InAppChannel,
    LogEmailChannel,
    { provide: NOTIFICATION_CHANNELS, useFactory: (inApp: InAppChannel, email: LogEmailChannel) => [inApp, email], inject: [InAppChannel, LogEmailChannel] },
    { provide: NotificationRepository, useClass: TypeOrmNotificationRepository },
  ],
})
export class NotificationsModule {}
