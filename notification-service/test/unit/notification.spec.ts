import { InMemoryEventBus } from '@vantage-pmo/event-bus';
import { DomainEventsHandler } from '../../src/notifications/application/internal/event-handlers/domain-events.handler';
import { NotificationCommandService } from '../../src/notifications/application/internal/command-services/notification-command.service';
import { NotificationChannel } from '../../src/notifications/application/internal/outbound-services/notification-channel';
import { Notification } from '../../src/notifications/domain/model/aggregates/notification';
import { MarkNotificationAsReadCommand } from '../../src/notifications/domain/model/commands/notification-commands';
import { NotificationType } from '../../src/notifications/domain/model/value-objects/notification-type';
import { NotificationRepository } from '../../src/notifications/domain/repositories/notification.repository';
import { NotificationFactory } from '../../src/notifications/domain/services/notification-factory';
import { LogEmailChannel } from '../../src/notifications/infrastructure/channels/log-email.channel';
import { ResourceNotFoundError } from '../../src/shared/domain/domain-error';

class InMemoryNotifications extends NotificationRepository {
  items = new Map<string, Notification>();
  async save(n: Notification) { this.items.set(n.id, n); }
  async findById(id: string) { return this.items.get(id) ?? null; }
  async existsByEventKey(key: string, r: string) { return [...this.items.values()].some((n) => n.eventKey === key && n.recipientId === r); }
  async findByRecipient(r: string, c: { unreadOnly: boolean }) {
    const items = [...this.items.values()].filter((n) => n.recipientId === r && (!c.unreadOnly || !n.read));
    return { items, total: items.length };
  }
  async countUnread(r: string) { return [...this.items.values()].filter((n) => n.recipientId === r && !n.read).length; }
  async markAllAsRead(r: string, at: Date) {
    let n = 0;
    for (const x of this.items.values()) if (x.recipientId === r && !x.read) { x.markAsRead(at); n++; }
    return n;
  }
}

class SpyChannel extends NotificationChannel {
  readonly name = 'spy';
  delivered: Notification[] = [];
  supports() { return true; }
  async deliver(n: Notification) { this.delivered.push(n); }
}

const dueSoon = {
  projectId: 'p1', projectName: 'ERP Logística', ownerId: 'owner-1', milestoneId: 'm1', milestoneName: 'Go-live', dueDate: '2026-11-09',
};

describe('NotificationFactory (ACL)', () => {
  it('turns a milestone due soon into a notification for the project owner (US09)', () => {
    const bus = new InMemoryEventBus();
    const [n] = NotificationFactory.fromEvent({ id: '1', type: 'projects.milestone-due-soon', key: 'k1', source: 'project-task', occurredAt: '', payload: dueSoon });
    expect(n.recipientId).toBe('owner-1');
    expect(n.type).toBe(NotificationType.MILESTONE_DUE_SOON);
    expect(n.message).toContain('09/11/2026');
    expect(n.read).toBe(false);
    expect(bus.kind).toBe('in-memory');
  });

  it('notifies the assignee of a task and ignores unknown events', () => {
    const [n] = NotificationFactory.fromEvent({
      id: '2', type: 'projects.task-assigned', key: 'k2', source: 'project-task', occurredAt: '',
      payload: { taskId: 't1', title: 'Diseñar BD', projectId: 'p1', projectName: 'ERP', assigneeId: 'm1', dueDate: null },
    });
    expect(n.recipientId).toBe('m1');
    expect(NotificationFactory.fromEvent({ id: '3', type: 'other.thing', key: 'k3', source: 'x', occurredAt: '', payload: {} })).toEqual([]);
  });
});

describe('Critical risks (Sprint 3)', () => {
  it('notifies the project owner and the risk responsible of a critical risk', () => {
    const ns = NotificationFactory.fromEvent({
      id: '9', type: 'risks.critical-risk-identified', key: 'critical-risk:r1:1', source: 'risk', occurredAt: '',
      payload: { riskId: 'r1', projectId: 'p1', projectName: 'ERP', ownerId: 'owner', responsibleId: 'm1', title: 'Proveedor RFID', probability: 4, impact: 5, score: 20 },
    });
    expect(ns.map((n) => n.recipientId)).toEqual(['owner', 'm1']);
    expect(ns[0].type).toBe(NotificationType.CRITICAL_RISK);
    expect(new LogEmailChannel().supports(ns[0])).toBe(true);
  });
});

describe('DomainEventsHandler (idempotent consumer)', () => {
  it('creates a single notification even if the same event is delivered twice', async () => {
    const bus = new InMemoryEventBus();
    const repo = new InMemoryNotifications();
    const spy = new SpyChannel();
    new DomainEventsHandler(bus, repo, [spy]).onModuleInit();

    await bus.publish('projects.milestone-due-soon', dueSoon, 'milestone-due-soon:m1:2026-11-09');
    await bus.publish('projects.milestone-due-soon', dueSoon, 'milestone-due-soon:m1:2026-11-09');

    expect(repo.items.size).toBe(1);
    expect(spy.delivered).toHaveLength(1);
    expect(await repo.countUnread('owner-1')).toBe(1);
  });

  it('sends urgent alerts also by e-mail, but not task assignments', () => {
    const email = new LogEmailChannel();
    const urgent = Notification.create({ recipientId: 'u', type: NotificationType.PROJECT_STALLED, title: 't', message: 'm', eventKey: 'k' });
    const normal = Notification.create({ recipientId: 'u', type: NotificationType.TASK_ASSIGNED, title: 't', message: 'm', eventKey: 'k' });
    expect(email.supports(urgent)).toBe(true);
    expect(email.supports(normal)).toBe(false);
  });
});

describe('Bell (US63)', () => {
  it('marks a notification as read once and only for its recipient', async () => {
    const repo = new InMemoryNotifications();
    const n = Notification.create({ recipientId: 'u1', type: NotificationType.TASK_ASSIGNED, title: 'Nueva tarea', message: 'm', eventKey: 'k' });
    await repo.save(n);
    const service = new NotificationCommandService(repo);

    await expect(service.handleMarkAsRead(new MarkNotificationAsReadCommand(n.id, 'other'))).rejects.toBeInstanceOf(ResourceNotFoundError);
    const read = await service.handleMarkAsRead(new MarkNotificationAsReadCommand(n.id, 'u1'));
    const firstReadAt = read.readAt;
    await service.handleMarkAsRead(new MarkNotificationAsReadCommand(n.id, 'u1'));
    expect(read.read).toBe(true);
    expect(read.readAt).toBe(firstReadAt);
    expect(await repo.countUnread('u1')).toBe(0);
  });
});
