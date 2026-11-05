import { RedisStreamsEventBus } from '../src/redis-streams-event-bus';

/** Integration test: runs only when a Redis server is reachable (REDIS_URL). */
const url = process.env.REDIS_URL;
const maybe = url ? describe : describe.skip;

maybe('RedisStreamsEventBus', () => {
  const stream = `test:events:${Date.now()}`;
  const silent = { log: () => undefined, warn: () => undefined, error: () => undefined };

  it('delivers events published while the consumer was offline (consumer group)', async () => {
    const consumerA = new RedisStreamsEventBus({ url: url!, group: 'svc-a', stream, blockMs: 200, logger: silent });
    const got: string[] = [];
    consumerA.subscribe('x.happened', async (e) => { got.push(e.key); });
    await consumerA.start();
    await consumerA.stop();

    const publisher = new RedisStreamsEventBus({ url: url!, group: 'publisher', stream, logger: silent });
    await publisher.publish('x.happened', { n: 1 }, 'k1');
    await publisher.publish('x.happened', { n: 2 }, 'k2');
    await publisher.stop();

    const restarted = new RedisStreamsEventBus({ url: url!, group: 'svc-a', stream, blockMs: 200, logger: silent });
    restarted.subscribe('x.happened', async (e) => { got.push(e.key); });
    await restarted.start();
    await new Promise((r) => setTimeout(r, 800));
    await restarted.stop();

    expect(got).toEqual(['k1', 'k2']);
  });

  it('retries an event whose handler failed until it is acknowledged', async () => {
    const s = `${stream}:retry`;
    let attempts = 0;
    const bus = new RedisStreamsEventBus({ url: url!, group: 'svc-b', stream: s, blockMs: 200, logger: silent });
    bus.subscribe('y.happened', async () => {
      attempts += 1;
      if (attempts === 1) throw new Error('transient');
    });
    await bus.start();
    await bus.publish('y.happened', {}, 'y1');
    await new Promise((r) => setTimeout(r, 3500));
    await bus.stop();
    expect(attempts).toBe(2);
  }, 10000);
});
