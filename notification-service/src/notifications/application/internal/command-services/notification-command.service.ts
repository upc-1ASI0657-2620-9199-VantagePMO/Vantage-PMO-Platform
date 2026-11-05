import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { Notification } from '../../../domain/model/aggregates/notification';
import { MarkAllNotificationsAsReadCommand, MarkNotificationAsReadCommand } from '../../../domain/model/commands/notification-commands';
import { NotificationRepository } from '../../../domain/repositories/notification.repository';

@Injectable()
export class NotificationCommandService {
  constructor(private readonly notifications: NotificationRepository) {}

  async handleMarkAsRead(command: MarkNotificationAsReadCommand): Promise<Notification> {
    const notification = await this.notifications.findById(command.notificationId);
    // Another user's notification is reported as not found, so ids cannot be probed.
    if (!notification || !notification.isFor(command.userId)) throw new ResourceNotFoundError('Notification', command.notificationId);
    notification.markAsRead();
    await this.notifications.save(notification);
    return notification;
  }

  async handleMarkAllAsRead(command: MarkAllNotificationsAsReadCommand): Promise<number> {
    return this.notifications.markAllAsRead(command.userId, new Date());
  }
}
