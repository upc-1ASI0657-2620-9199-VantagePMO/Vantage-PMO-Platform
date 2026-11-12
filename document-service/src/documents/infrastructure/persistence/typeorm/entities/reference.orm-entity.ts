import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('project_references')
export class ProjectReferenceOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 150 }) name: string;
  @Column({ name: 'owner_id', type: 'uuid' }) ownerId: string;
  @Column({ type: 'varchar', length: 20 }) status: string;
  @UpdateDateColumn({ name: 'synced_at', type: 'timestamptz' }) syncedAt: Date;
}

@Entity('milestone_references')
export class MilestoneReferenceOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'project_id', type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 150 }) name: string;
  @Column({ type: 'varchar', length: 20 }) status: string;
  @UpdateDateColumn({ name: 'synced_at', type: 'timestamptz' }) syncedAt: Date;
}

@Entity('file_blobs')
export class FileBlobOrmEntity {
  @PrimaryColumn({ name: 'storage_key', type: 'varchar', length: 120 }) storageKey: string;
  @Column({ name: 'content_type', type: 'varchar', length: 120 }) contentType: string;
  @Column({ type: 'bytea' }) data: Buffer;
}
