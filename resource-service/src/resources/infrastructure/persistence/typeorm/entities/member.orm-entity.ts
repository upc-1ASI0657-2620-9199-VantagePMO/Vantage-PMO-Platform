import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('members')
export class MemberOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'full_name', type: 'varchar', length: 150 }) fullName: string;
  @Column({ type: 'varchar', length: 254 }) email: string;
  @Column({ type: 'varchar', length: 30 }) role: string;
  @UpdateDateColumn({ name: 'synced_at', type: 'timestamptz' }) syncedAt: Date;
}
