import { Injectable } from '@nestjs/common';
import { NotificationChannel } from '../../application/internal/outbound-services/notification-channel';
import { Notification } from '../../domain/model/aggregates/notification';

/** In-app channel: the stored notification is what the bell (US63) reads, so nothing else is needed. */
@Injectable()
export class InAppChannel extends NotificationChannel {
  readonly name = 'in-app';
  supports(): boolean { return true; }
  async deliver(_notification: Notification): Promise<void> {}
}
