import { Notification } from '../../../domain/model/aggregates/notification';

/** Strategy port: each delivery channel decides whether it applies and how to deliver. */
export abstract class NotificationChannel {
  abstract readonly name: string;
  abstract supports(notification: Notification): boolean;
  abstract deliver(notification: Notification): Promise<void>;
}

export const NOTIFICATION_CHANNELS = Symbol('NOTIFICATION_CHANNELS');
