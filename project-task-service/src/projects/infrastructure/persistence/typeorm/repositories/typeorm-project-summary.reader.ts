import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProjectStatus } from '../../../../domain/model/value-objects/project-status';
import { Page, ProjectSummary, ProjectSummaryReader } from '../../../../domain/repositories/project-summary.reader';

/**
 * Optimized read path (CQRS-lite, US47): a single aggregated SQL query returns the
 * portfolio page with its basic KPIs, instead of hydrating every aggregate.
 */
@Injectable()
export class TypeOrmProjectSummaryReader extends ProjectSummaryReader {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async findPage(criteria: { page: number; size: number; status?: ProjectStatus; client?: string }): Promise<Page<ProjectSummary>> {
    const where: string[] = [];
    const params: unknown[] = [];
    if (criteria.status) {
      params.push(criteria.status);
      where.push(`p.status = $${params.length}`);
    }
    if (criteria.client) {
      params.push(`%${criteria.client}%`);
      where.push(`p.client ILIKE $${params.length}`);
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    // Tables live in the service's private schema when DB_SCHEMA is configured (shared cloud instance).
    const schema = (this.dataSource.options as { schema?: string }).schema;
    const t = (table: string) => (schema ? `"${schema}"."${table}"` : table);

    const [{ count }] = await this.dataSource.query(`SELECT COUNT(*)::int AS count FROM ${t('projects')} p ${whereSql}`, params);

    const offset = (criteria.page - 1) * criteria.size;
    const rows = await this.dataSource.query(
      `SELECT p.id, p.name, p.client, p.start_date, p.end_date, p.status, p.budget, p.currency,
              COALESCE(t.total, 0)::int     AS total_tasks,
              COALESCE(t.completed, 0)::int AS completed_tasks,
              COALESCE(m.at_risk, 0)::int   AS milestones_at_risk
         FROM ${t('projects')} p
         LEFT JOIN (SELECT project_id, COUNT(*) AS total, COUNT(*) FILTER (WHERE status = 'DONE') AS completed
                      FROM ${t('tasks')} GROUP BY project_id) t ON t.project_id = p.id
         LEFT JOIN (SELECT project_id, COUNT(*) AS at_risk
                      FROM ${t('milestones')}
                     WHERE status = 'PENDING' AND due_date <= CURRENT_DATE + 3
                     GROUP BY project_id) m ON m.project_id = p.id
         ${whereSql}
         ORDER BY p.created_at DESC
         LIMIT ${criteria.size} OFFSET ${offset}`,
      params,
    );

    const toIsoDate = (v: Date | string) => (v instanceof Date ? v.toISOString().substring(0, 10) : String(v).substring(0, 10));
    const items: ProjectSummary[] = rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      client: r.client,
      startDate: toIsoDate(r.start_date),
      endDate: toIsoDate(r.end_date),
      status: r.status,
      budget: Number(r.budget),
      currency: r.currency,
      totalTasks: r.total_tasks,
      completedTasks: r.completed_tasks,
      progressPercentage: r.total_tasks ? Math.round((r.completed_tasks / r.total_tasks) * 100) : 0,
      milestonesAtRisk: r.milestones_at_risk,
    }));

    return {
      items,
      page: criteria.page,
      size: criteria.size,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / criteria.size)),
    };
  }
}
