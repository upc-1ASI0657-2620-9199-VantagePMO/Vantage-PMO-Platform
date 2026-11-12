import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('risks')
export class RiskOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Index()
  @Column({ name: 'project_id', type: 'uuid' }) projectId: string;
  @Column({ type: 'varchar', length: 150 }) title: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'varchar', length: 20 }) category: string;
  @Column({ type: 'varchar', length: 20 }) status: string;
  @Column({ name: 'responsible_id', type: 'uuid', nullable: true }) responsibleId: string | null;
  @Column({ name: 'mitigation_plan', type: 'text', nullable: true }) mitigationPlan: string | null;
  @Column({ name: 'identified_by', type: 'uuid' }) identifiedBy: string;
  @Column({ type: 'smallint' }) score: number;
  @Column({ type: 'varchar', length: 10 }) level: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' }) updatedAt: Date;
  @OneToMany(() => RiskAssessmentOrmEntity, (a) => a.risk, { cascade: true, eager: true })
  assessments: RiskAssessmentOrmEntity[];
}

@Entity('risk_assessments')
export class RiskAssessmentOrmEntity {
  @PrimaryColumn({ name: 'risk_id', type: 'uuid' }) riskId: string;
  @PrimaryColumn({ type: 'int' }) number: number;
  @ManyToOne(() => RiskOrmEntity, (r) => r.assessments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'risk_id' })
  risk: RiskOrmEntity;
  @Column({ type: 'smallint' }) probability: number;
  @Column({ type: 'smallint' }) impact: number;
  @Column({ type: 'smallint' }) score: number;
  @Column({ type: 'varchar', length: 10 }) level: string;
  @Column({ type: 'varchar', length: 300, nullable: true }) note: string | null;
  @Column({ name: 'assessed_by', type: 'uuid' }) assessedBy: string;
  @Column({ name: 'assessed_at', type: 'timestamptz' }) assessedAt: Date;
}

@Entity('project_references')
export class ProjectReferenceOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 150 }) name: string;
  @Column({ name: 'owner_id', type: 'uuid' }) ownerId: string;
  @Column({ type: 'varchar', length: 20 }) status: string;
  @UpdateDateColumn({ name: 'synced_at', type: 'timestamptz' }) syncedAt: Date;
}
