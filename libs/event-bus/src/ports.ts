import { DomainEvent } from './domain-event';

export type EventHandler = (event: DomainEvent) => Promise<void>;

/** Output port used by the application layer to announce what happened in its domain. */
export interface EventPublisher {
  publish<T>(type: string, payload: T, key?: string): Promise<DomainEvent<T>>;
}

/** Input port used by a bounded context to react to the facts of other contexts. */
export interface EventSubscriber {
  subscribe(type: string, handler: EventHandler): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

export interface EventBus extends EventPublisher, EventSubscriber {
  readonly kind: 'redis-streams' | 'in-memory';
}

/** Injection token for frameworks with dependency injection (NestJS). */
export const EVENT_BUS = Symbol('EVENT_BUS');
