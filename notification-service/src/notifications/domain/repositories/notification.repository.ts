import { Notification } from '../model/aggregates/notification';

export abstract class NotificationRepository {
  abstract save(notification: Notification): Promise<void>;
  abstract findById(id: string): Promise<Notification | null>;
  abstract existsByEventKey(eventKey: string, recipientId: string): Promise<boolean>;
  abstract findByRecipient(recipientId: string, criteria: { unreadOnly: boolean; page: number; size: number }): Promise<{ items: Notification[]; total: number }>;
  abstract countUnread(recipientId: string): Promise<number>;
  abstract markAllAsRead(recipientId: string, at: Date): Promise<number>;
}
