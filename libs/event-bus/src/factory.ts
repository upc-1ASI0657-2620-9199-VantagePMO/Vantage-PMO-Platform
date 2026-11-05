import { InMemoryEventBus } from './in-memory-event-bus';
import { EventBus } from './ports';
import { RedisStreamsEventBus } from './redis-streams-event-bus';

/** Chooses the adapter from configuration: Redis Streams when REDIS_URL is set, in-memory otherwise. */
export function createEventBus(group: string, env: NodeJS.ProcessEnv = process.env): EventBus {
  if (env.REDIS_URL) return new RedisStreamsEventBus({ url: env.REDIS_URL, group, stream: env.EVENT_STREAM });
  console.warn(`[event-bus] REDIS_URL not set: '${group}' uses the in-memory adapter (no cross-service delivery)`);
  return new InMemoryEventBus(group);
}
