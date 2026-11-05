import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('notifications')
@Index(['eventKey', 'recipientId'], { unique: true })
@Index(['recipientId', 'read'])
export class NotificationOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'recipient_id', type: 'uuid' }) recipientId: string;
  @Column({ type: 'varchar', length: 30 }) type: string;
  @Column({ type: 'varchar', length: 150 }) title: string;
  @Column({ type: 'text' }) message: string;
  @Column({ type: 'varchar', length: 200, nullable: true }) link: string | null;
  @Column({ name: 'event_key', type: 'varchar', length: 200 }) eventKey: string;
  @Column({ type: 'boolean', default: false }) read: boolean;
  @Column({ name: 'read_at', type: 'timestamptz', nullable: true }) readAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
