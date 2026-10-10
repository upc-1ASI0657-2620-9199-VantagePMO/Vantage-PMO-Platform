import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('users')
export class UserOrmEntity {
  @PrimaryColumn('uuid') id: string;
  @Column({ name: 'full_name', type: 'varchar', length: 120 }) fullName: string;
  @Column({ type: 'varchar', length: 120, unique: true }) email: string;
  @Column({ name: 'password_hash', type: 'varchar', length: 100 }) passwordHash: string;
  @Column({ type: 'varchar', length: 20 }) role: string;
  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' }) createdAt: Date;
}
