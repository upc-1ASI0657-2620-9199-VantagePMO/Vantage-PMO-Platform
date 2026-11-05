import { Injectable } from '@nestjs/common';
import { GetMyNotificationsQuery, GetUnreadCountQuery } from '../../../domain/model/queries/notification-queries';
import { NotificationRepository } from '../../../domain/repositories/notification.repository';

@Injectable()
export class NotificationQueryService {
  constructor(private readonly notifications: NotificationRepository) {}

  handleGetMine(q: GetMyNotificationsQuery) {
    return this.notifications.findByRecipient(q.userId, { unreadOnly: q.unreadOnly, page: q.page, size: q.size });
  }

  handleGetUnreadCount(q: GetUnreadCountQuery) {
    return this.notifications.countUnread(q.userId);
  }
}
