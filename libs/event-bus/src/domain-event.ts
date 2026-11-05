import { randomUUID } from 'crypto';

/**
 * Integration event exchanged between bounded contexts.
 * `key` identifies the business fact so consumers can process it only once (idempotent consumer).
 */
export interface DomainEvent<T = Record<string, unknown>> {
  id: string;
  type: string;
  key: string;
  source: string;
  occurredAt: string;
  payload: T;
}

export function createEvent<T>(type: string, source: string, payload: T, key?: string): DomainEvent<T> {
  const id = randomUUID();
  return { id, type, key: key ?? id, source, occurredAt: new Date().toISOString(), payload };
}
