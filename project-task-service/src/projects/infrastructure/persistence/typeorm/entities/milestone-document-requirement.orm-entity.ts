import { Column, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('milestone_document_requirements')
export class MilestoneDocumentRequirementOrmEntity {
  @PrimaryColumn({ name: 'requirement_id', type: 'uuid' }) requirementId: string;
  @Column({ name: 'project_id', type: 'uuid' }) projectId: string;
  @Index()
  @Column({ name: 'milestone_id', type: 'uuid' }) milestoneId: string;
  @Column({ type: 'varchar', length: 150 }) name: string;
  @Column({ type: 'boolean', default: false }) fulfilled: boolean;
  @UpdateDateColumn({ name: 'synced_at', type: 'timestamptz' }) syncedAt: Date;
}
