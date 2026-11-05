import { InMemoryEventBus } from '../src/in-memory-event-bus';
import { createEventBus } from '../src/factory';

describe('InMemoryEventBus', () => {
  it('delivers an event to every handler subscribed to its type', async () => {
    const bus = new InMemoryEventBus('test');
    const received: string[] = [];
    bus.subscribe('projects.task-assigned', async (e) => { received.push(`a:${e.key}`); });
    bus.subscribe('projects.task-assigned', async (e) => { received.push(`b:${e.key}`); });
    bus.subscribe('other', async () => { received.push('other'); });

    await bus.publish('projects.task-assigned', { taskId: 't1' }, 'task-1');

    expect(received).toEqual(['a:task-1', 'b:task-1']);
  });

  it('builds the envelope with id, source, timestamp and a default key', async () => {
    const bus = new InMemoryEventBus('project-task');
    const event = await bus.publish('projects.project-registered', { projectId: 'p1' });
    expect(event.source).toBe('project-task');
    expect(event.key).toBe(event.id);
    expect(new Date(event.occurredAt).toString()).not.toBe('Invalid Date');
    expect(bus.published).toHaveLength(1);
  });

  it('falls back to the in-memory adapter when REDIS_URL is not configured', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    expect(createEventBus('resource', {}).kind).toBe('in-memory');
  });
});
