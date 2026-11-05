import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DomainEvent, EVENT_BUS, EventSubscriber } from '@vantage-pmo/event-bus';
import { NotificationFactory, SUBSCRIBED_EVENTS } from '../../../domain/services/notification-factory';
import { NotificationRepository } from '../../../domain/repositories/notification.repository';
import { NOTIFICATION_CHANNELS, NotificationChannel } from '../outbound-services/notification-channel';

/**
 * Idempotent consumer: the broker delivers at least once, so a notification is created only if
 * no other one exists for the same event key and recipient.
 */
@Injectable()
export class DomainEventsHandler implements OnModuleInit {
  private readonly logger = new Logger(DomainEventsHandler.name);

  constructor(
    @Inject(EVENT_BUS) private readonly bus: EventSubscriber,
    private readonly notifications: NotificationRepository,
    @Inject(NOTIFICATION_CHANNELS) private readonly channels: NotificationChannel[],
  ) {}

  onModuleInit(): void {
    for (const type of SUBSCRIBED_EVENTS) this.bus.subscribe(type, async (e) => { await this.handle(e); });
  }

  async handle(event: DomainEvent): Promise<number> {
    let created = 0;
    for (const notification of NotificationFactory.fromEvent(event)) {
      if (await this.notifications.existsByEventKey(notification.eventKey, notification.recipientId)) continue;
      await this.notifications.save(notification);
      for (const channel of this.channels.filter((c) => c.supports(notification))) await channel.deliver(notification);
      created += 1;
    }
    if (created) this.logger.log(`${event.type} -> ${created} notification(s)`);
    return created;
  }
}
