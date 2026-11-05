import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel } from '../../application/internal/outbound-services/notification-channel';
import { Notification } from '../../domain/model/aggregates/notification';
import { URGENT_TYPES } from '../../domain/model/value-objects/notification-type';

/**
 * E-mail channel for urgent alerts. In this sprint the adapter only writes the message to the
 * log; an SMTP or e-mail API adapter will replace it without touching the application layer.
 */
@Injectable()
export class LogEmailChannel extends NotificationChannel {
  readonly name = 'email';
  private readonly logger = new Logger('EmailChannel');

  supports(notification: Notification): boolean {
    return URGENT_TYPES.includes(notification.type);
  }

  async deliver(notification: Notification): Promise<void> {
    this.logger.log(`[e-mail] to user ${notification.recipientId}: ${notification.title}`);
  }
}
