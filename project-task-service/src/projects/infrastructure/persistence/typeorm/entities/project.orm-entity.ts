import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { MilestoneOrmEntity } from './milestone.orm-entity';

@Entity('projects')
export class ProjectOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 150 }) name: string;
  @Column({ type: 'varchar', length: 150 }) client: string;
  @Column({ name: 'start_date', type: 'date' }) startDate: string;
  @Column({ name: 'end_date', type: 'date' }) endDate: string;
  @Column({ type: 'varchar', length: 20 }) status: string;
  @Column({ type: 'numeric', precision: 12, scale: 2 }) budget: string;
  @Column({ type: 'varchar', length: 3, default: 'PEN' }) currency: string;
  @Column({ name: 'owner_id', type: 'uuid' }) ownerId: string;
  @OneToMany(() => MilestoneOrmEntity, (m) => m.project, { cascade: true, eager: true })
  milestones: MilestoneOrmEntity[];
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
