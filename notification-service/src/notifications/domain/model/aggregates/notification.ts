import { randomUUID } from 'crypto';
import { DomainError } from '../../../../shared/domain/domain-error';
import { NotificationType } from '../value-objects/notification-type';

interface NotificationProps {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  eventKey: string;
  read: boolean;
  readAt: Date | null;
  createdAt: Date;
}

/** Aggregate root of the Notification context: one message for one recipient. */
export class Notification {
  private constructor(private props: NotificationProps) {}

  static create(params: { recipientId: string; type: NotificationType; title: string; message: string; link?: string | null; eventKey: string }): Notification {
    if (!params.recipientId) throw new DomainError('A notification needs a recipient.', 'recipient-required');
    if (!params.title?.trim()) throw new DomainError('A notification needs a title.', 'title-required');
    if (!params.eventKey) throw new DomainError('A notification needs the key of the event that produced it.', 'event-key-required');
    return new Notification({
      id: randomUUID(), recipientId: params.recipientId, type: params.type, title: params.title.trim().substring(0, 150),
      message: params.message, link: params.link ?? null, eventKey: params.eventKey, read: false, readAt: null, createdAt: new Date(),
    });
  }

  static restore(props: NotificationProps): Notification {
    return new Notification({ ...props });
  }

  /** Idempotent: reading twice keeps the first reading time. */
  markAsRead(at: Date = new Date()): void {
    if (this.props.read) return;
    this.props.read = true;
    this.props.readAt = at;
  }

  isFor(userId: string): boolean {
    return this.props.recipientId === userId;
  }

  get id() { return this.props.id; }
  get recipientId() { return this.props.recipientId; }
  get type() { return this.props.type; }
  get title() { return this.props.title; }
  get message() { return this.props.message; }
  get link() { return this.props.link; }
  get eventKey() { return this.props.eventKey; }
  get read() { return this.props.read; }
  get readAt() { return this.props.readAt; }
  get createdAt() { return this.props.createdAt; }
}
