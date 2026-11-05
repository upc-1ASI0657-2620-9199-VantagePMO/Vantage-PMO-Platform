import Redis from 'ioredis';
import { createEvent, DomainEvent } from './domain-event';
import { EventBus, EventHandler } from './ports';

export interface RedisStreamsOptions {
  url: string;
  /** Logical service name: it is the consumer group, so every service gets its own copy of each event. */
  group: string;
  stream?: string;
  consumer?: string;
  maxLength?: number;
  blockMs?: number;
  batchSize?: number;
  logger?: Pick<Console, 'log' | 'warn' | 'error'>;
}

/**
 * Publish/Subscribe adapter over Redis Streams (Render Key Value).
 * - XADD appends the event to a single append-only stream.
 * - Each subscriber service reads through its own consumer group (XREADGROUP), so a service that
 *   was sleeping receives the events it missed when it wakes up.
 * - An event is acknowledged (XACK) only after its handler succeeds; failed events stay pending
 *   and are retried (at-least-once delivery, consumers must be idempotent).
 */
export class RedisStreamsEventBus implements EventBus {
  readonly kind = 'redis-streams' as const;
  private readonly writer: Redis;
  private reader?: Redis;
  private readonly handlers = new Map<string, EventHandler[]>();
  private readonly stream: string;
  private readonly consumer: string;
  private running = false;
  private loop?: Promise<void>;
  private readonly log: Pick<Console, 'log' | 'warn' | 'error'>;

  constructor(private readonly options: RedisStreamsOptions) {
    this.stream = options.stream ?? 'vantage:events';
    this.consumer = options.consumer ?? `${options.group}-${process.pid}`;
    this.log = options.logger ?? console;
    this.writer = new Redis(options.url, { maxRetriesPerRequest: 3, lazyConnect: false });
    this.writer.on('error', (e) => this.log.warn(`[event-bus] redis error: ${e.message}`));
  }

  subscribe(type: string, handler: EventHandler): void {
    this.handlers.set(type, [...(this.handlers.get(type) ?? []), handler]);
  }

  async publish<T>(type: string, payload: T, key?: string): Promise<DomainEvent<T>> {
    const event = createEvent(type, this.options.group, payload, key);
    await this.writer.xadd(
      this.stream, 'MAXLEN', '~', String(this.options.maxLength ?? 10000), '*',
      'type', event.type, 'data', JSON.stringify(event),
    );
    return event;
  }

  async start(): Promise<void> {
    if (this.handlers.size === 0 || this.running) return;
    try {
      await this.writer.xgroup('CREATE', this.stream, this.options.group, '0', 'MKSTREAM');
    } catch (e) {
      if (!String((e as Error).message).includes('BUSYGROUP')) throw e;
    }
    this.reader = this.writer.duplicate();
    this.running = true;
    this.loop = this.consume();
    this.log.log(`[event-bus] '${this.options.group}' consuming ${[...this.handlers.keys()].join(', ')}`);
  }

  async stop(): Promise<void> {
    this.running = false;
    this.reader?.disconnect();
    await this.loop?.catch(() => undefined);
    this.writer.disconnect();
  }

  private async consume(): Promise<void> {
    let cursor = '0'; // first drain this consumer's pending entries, then read new ones ('>')
    while (this.running) {
      try {
        const result = (await this.reader!.xreadgroup(
          'GROUP', this.options.group, this.consumer,
          'COUNT', String(this.options.batchSize ?? 20),
          'BLOCK', String(this.options.blockMs ?? 5000),
          'STREAMS', this.stream, cursor,
        )) as [string, [string, string[]][]][] | null;
        const entries = result?.[0]?.[1] ?? [];
        if (cursor === '0' && entries.length === 0) cursor = '>';
        let failed = false;
        for (const [id, fields] of entries) failed = !(await this.dispatch(id, fields)) || failed;
        if (failed) {
          cursor = '0';
          await new Promise((r) => setTimeout(r, 2000));
        }
      } catch (e) {
        if (!this.running) return;
        this.log.warn(`[event-bus] read failed: ${(e as Error).message}`);
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  private async dispatch(id: string, fields: string[]): Promise<boolean> {
    const index = fields.indexOf('data');
    const event = JSON.parse(fields[index + 1]) as DomainEvent;
    try {
      for (const handler of this.handlers.get(event.type) ?? []) await handler(event);
      await this.writer.xack(this.stream, this.options.group, id);
      return true;
    } catch (e) {
      this.log.error(`[event-bus] handler for ${event.type} (${event.id}) failed: ${(e as Error).message}`);
      return false;
    }
  }
}
