import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { ProjectOrmEntity } from './project.orm-entity';

@Entity('milestones')
export class MilestoneOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'project_id', type: 'uuid' }) projectId: string;
  @ManyToOne(() => ProjectOrmEntity, (p) => p.milestones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectOrmEntity;
  @Column({ type: 'varchar', length: 150 }) name: string;
  @Column({ name: 'due_date', type: 'date' }) dueDate: string;
  @Column({ type: 'varchar', length: 20 }) status: string;
}
