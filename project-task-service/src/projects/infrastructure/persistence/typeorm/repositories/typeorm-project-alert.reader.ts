import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MilestoneAlertCandidate, ProjectActivity, ProjectAlertReader } from '../../../../domain/repositories/project-alert.reader';

const toIsoDate = (v: Date | string) => (v instanceof Date ? v.toISOString().substring(0, 10) : String(v).substring(0, 10));

@Injectable()
export class TypeOrmProjectAlertReader extends ProjectAlertReader {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  private t(table: string): string {
    const schema = (this.dataSource.options as { schema?: string }).schema;
    return schema ? `"${schema}"."${table}"` : table;
  }

  async findPendingMilestonesDueBetween(from: string, to: string): Promise<MilestoneAlertCandidate[]> {
    const rows = await this.dataSource.query(
      `SELECT m.id, m.name, m.due_date, m.status, p.id AS project_id, p.name AS project_name, p.owner_id
         FROM ${this.t('milestones')} m JOIN ${this.t('projects')} p ON p.id = m.project_id
        WHERE m.status = 'PENDING' AND p.status IN ('PLANNED', 'IN_PROGRESS', 'ON_HOLD')
          AND m.due_date BETWEEN $1 AND $2`,
      [from, to],
    );
    return rows.map((r: any) => ({
      projectId: r.project_id,
      projectName: r.project_name,
      ownerId: r.owner_id,
      milestoneId: r.id,
      milestoneName: r.name,
      dueDate: toIsoDate(r.due_date),
      status: r.status,
    }));
  }

  async findOpenProjectsActivity(): Promise<ProjectActivity[]> {
    const rows = await this.dataSource.query(
      `SELECT p.id, p.name, p.owner_id, p.status,
              GREATEST(p.updated_at, COALESCE(MAX(t.updated_at), p.updated_at)) AS last_activity
         FROM ${this.t('projects')} p LEFT JOIN ${this.t('tasks')} t ON t.project_id = p.id
        WHERE p.status IN ('PLANNED', 'IN_PROGRESS')
        GROUP BY p.id`,
    );
    return rows.map((r: any) => ({
      projectId: r.id,
      projectName: r.name,
      ownerId: r.owner_id,
      status: r.status,
      lastActivityAt: new Date(r.last_activity),
    }));
  }

  async findAllMilestones() {
    const rows = await this.dataSource.query(
      `SELECT m.id, m.name, m.due_date, m.status, p.id AS project_id, p.name AS project_name, p.owner_id
         FROM ${this.t('milestones')} m JOIN ${this.t('projects')} p ON p.id = m.project_id`,
    );
    return rows.map((r: any) => ({
      projectId: r.project_id, projectName: r.project_name, ownerId: r.owner_id,
      milestoneId: r.id, milestoneName: r.name, dueDate: toIsoDate(r.due_date), status: r.status,
    }));
  }

  async findAllSnapshots() {
    const rows = await this.dataSource.query(
      `SELECT id, name, client, owner_id, status, start_date, end_date FROM ${this.t('projects')}`,
    );
    return rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      client: r.client,
      ownerId: r.owner_id,
      status: r.status,
      startDate: toIsoDate(r.start_date),
      endDate: toIsoDate(r.end_date),
    }));
  }
}
