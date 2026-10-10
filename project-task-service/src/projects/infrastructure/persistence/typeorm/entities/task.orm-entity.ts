import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { ProjectOrmEntity } from './project.orm-entity';
import { MilestoneOrmEntity } from './milestone.orm-entity';

@Entity('tasks')
export class TaskOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Index()
  @Column({ name: 'project_id', type: 'uuid' }) projectId: string;
  @ManyToOne(() => ProjectOrmEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project?: ProjectOrmEntity;
  @Column({ name: 'milestone_id', type: 'uuid', nullable: true }) milestoneId: string | null;
  @ManyToOne(() => MilestoneOrmEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'milestone_id' })
  milestone?: MilestoneOrmEntity | null;
  @Column({ type: 'varchar', length: 200 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'varchar', length: 20 }) status: string;
  @Column({ type: 'varchar', length: 10 }) priority: string;
  @Column({ name: 'assigned_to', type: 'uuid', nullable: true }) assignedTo: string | null;
  @Column({ name: 'due_date', type: 'date', nullable: true }) dueDate: string | null;
  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true }) completedAt: Date | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
