import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity('document_requirements')
@Index(['milestoneId', 'name'], { unique: true })
export class DocumentRequirementOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'project_id', type: 'uuid' }) projectId: string;
  @Column({ name: 'milestone_id', type: 'uuid' }) milestoneId: string;
  @Column({ type: 'varchar', length: 150 }) name: string;
  @Column({ type: 'varchar', length: 300, nullable: true }) description: string | null;
  @Column({ name: 'fulfilled_by_document_id', type: 'uuid', nullable: true }) fulfilledByDocumentId: string | null;
  @Column({ name: 'defined_by', type: 'uuid' }) definedBy: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
