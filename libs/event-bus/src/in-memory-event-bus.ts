import { createEvent, DomainEvent } from './domain-event';
import { EventBus, EventHandler } from './ports';

/**
 * Adapter for unit tests and for running a single service without a broker.
 * Delivery is synchronous and in-process; nothing is persisted.
 */
export class InMemoryEventBus implements EventBus {
  readonly kind = 'in-memory' as const;
  readonly published: DomainEvent[] = [];
  private readonly handlers = new Map<string, EventHandler[]>();

  constructor(private readonly source = 'in-memory') {}

  subscribe(type: string, handler: EventHandler): void {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler]);
  }

  async publish<T>(type: string, payload: T, key?: string): Promise<DomainEvent<T>> {
    const event = createEvent(type, this.source, payload, key);
    this.published.push(event as DomainEvent);
    for (const handler of this.handlers.get(type) ?? []) await handler(event as DomainEvent);
    return event;
  }

  async start(): Promise<void> {}
  async stop(): Promise<void> {}
}
