import { Column, CreateDateColumn, Entity, Index, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/** Intermediate table member <-> project with the share of time (US14). */
@Entity('allocations')
export class AllocationOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Index()
  @Column({ name: 'project_id', type: 'uuid' }) projectId: string;
  @Index()
  @Column({ name: 'member_id', type: 'uuid' }) memberId: string;
  @Column({ type: 'varchar', length: 80 }) role: string;
  @Column({ type: 'smallint' }) percentage: number;
  @Column({ name: 'start_date', type: 'date' }) startDate: string;
  @Column({ name: 'end_date', type: 'date' }) endDate: string;
  @Column({ name: 'assigned_by', type: 'uuid' }) assignedBy: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
}
