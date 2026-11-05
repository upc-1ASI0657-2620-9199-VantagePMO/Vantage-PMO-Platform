import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('project_references')
export class ProjectReferenceOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 150 }) name: string;
  @Column({ name: 'owner_id', type: 'uuid' }) ownerId: string;
  @Column({ type: 'varchar', length: 20 }) status: string;
  @Column({ name: 'start_date', type: 'date' }) startDate: string;
  @Column({ name: 'end_date', type: 'date' }) endDate: string;
  @UpdateDateColumn({ name: 'synced_at', type: 'timestamptz' }) syncedAt: Date;
}
