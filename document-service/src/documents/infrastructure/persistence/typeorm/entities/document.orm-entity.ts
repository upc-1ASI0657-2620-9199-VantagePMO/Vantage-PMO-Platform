import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn } from 'typeorm';

@Entity('documents')
@Index(['projectId', 'name'])
export class DocumentOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'project_id', type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 150 }) name: string;
  @Column({ name: 'task_id', type: 'uuid', nullable: true }) taskId: string | null;
  @Column({ name: 'milestone_id', type: 'uuid', nullable: true }) milestoneId: string | null;
  @Column({ name: 'requirement_id', type: 'uuid', nullable: true }) requirementId: string | null;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @OneToMany(() => DocumentVersionOrmEntity, (v) => v.document, { cascade: true, eager: true })
  versions: DocumentVersionOrmEntity[];
}

@Entity('document_versions')
export class DocumentVersionOrmEntity {
  @PrimaryColumn({ name: 'document_id', type: 'uuid' }) documentId: string;
  @PrimaryColumn({ type: 'int' }) number: number;
  @ManyToOne(() => DocumentOrmEntity, (d) => d.versions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_id' })
  document: DocumentOrmEntity;
  @Column({ name: 'file_name', type: 'varchar', length: 200 }) fileName: string;
  @Column({ name: 'content_type', type: 'varchar', length: 120 }) contentType: string;
  @Column({ name: 'size_bytes', type: 'int' }) sizeBytes: number;
  @Column({ type: 'char', length: 64 }) checksum: string;
  @Column({ name: 'storage_key', type: 'varchar', length: 120 }) storageKey: string;
  @Column({ name: 'uploaded_by', type: 'uuid' }) uploadedBy: string;
  @Column({ name: 'uploaded_at', type: 'timestamptz' }) uploadedAt: Date;
}
