import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '../../../../domain/model/aggregates/notification';
import { NotificationType } from '../../../../domain/model/value-objects/notification-type';
import { NotificationRepository } from '../../../../domain/repositories/notification.repository';
import { NotificationOrmEntity } from '../entities/notification.orm-entity';

const toDomain = (e: NotificationOrmEntity) =>
  Notification.restore({ ...e, type: e.type as NotificationType });

@Injectable()
export class TypeOrmNotificationRepository extends NotificationRepository {
  constructor(@InjectRepository(NotificationOrmEntity) private readonly repo: Repository<NotificationOrmEntity>) {
    super();
  }

  async save(n: Notification): Promise<void> {
    await this.repo.save(this.repo.create({
      id: n.id, recipientId: n.recipientId, type: n.type, title: n.title, message: n.message, link: n.link,
      eventKey: n.eventKey, read: n.read, readAt: n.readAt, createdAt: n.createdAt,
    }));
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    return e ? toDomain(e) : null;
  }

  async existsByEventKey(eventKey: string, recipientId: string) {
    return this.repo.exists({ where: { eventKey, recipientId } });
  }

  async findByRecipient(recipientId: string, c: { unreadOnly: boolean; page: number; size: number }) {
    const where = c.unreadOnly ? { recipientId, read: false } : { recipientId };
    const [rows, total] = await this.repo.findAndCount({ where, order: { createdAt: 'DESC' }, skip: (c.page - 1) * c.size, take: c.size });
    return { items: rows.map(toDomain), total };
  }

  async countUnread(recipientId: string) {
    return this.repo.count({ where: { recipientId, read: false } });
  }

  async markAllAsRead(recipientId: string, at: Date) {
    const result = await this.repo.update({ recipientId, read: false }, { read: true, readAt: at });
    return result.affected ?? 0;
  }
}
