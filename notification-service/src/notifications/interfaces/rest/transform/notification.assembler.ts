import { Notification } from '../../../domain/model/aggregates/notification';
import { NotificationResource } from '../resources/notification.resources';

export class NotificationAssembler {
  static toResource(n: Notification): NotificationResource {
    return {
      id: n.id, type: n.type, title: n.title, message: n.message, link: n.link, read: n.read,
      readAt: n.readAt ? new Date(n.readAt).toISOString() : null, createdAt: new Date(n.createdAt).toISOString(),
    };
  }
}
