import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Risk } from '../../../../domain/model/aggregates/risk';
import { RiskLevel } from '../../../../domain/model/value-objects/risk-score';
import { OPEN_RISK_STATUSES, RiskCategory, RiskStatus } from '../../../../domain/model/value-objects/risk-status';
import { RiskRepository } from '../../../../domain/repositories/risk.repository';
import { RiskAssessmentOrmEntity, RiskOrmEntity } from '../entities/risk.orm-entity';

const toDomain = (e: RiskOrmEntity) =>
  Risk.restore({
    id: e.id, projectId: e.projectId, title: e.title, description: e.description, category: e.category as RiskCategory,
    status: e.status as RiskStatus, responsibleId: e.responsibleId, mitigationPlan: e.mitigationPlan, identifiedBy: e.identifiedBy,
    createdAt: e.createdAt, updatedAt: e.updatedAt,
    assessments: (e.assessments ?? []).map((a) => ({
      number: a.number, probability: a.probability, impact: a.impact, score: a.score, level: a.level as RiskLevel,
      note: a.note, assessedBy: a.assessedBy, assessedAt: a.assessedAt,
    })),
  });

@Injectable()
export class TypeOrmRiskRepository extends RiskRepository {
  constructor(@InjectRepository(RiskOrmEntity) private readonly repo: Repository<RiskOrmEntity>) {
    super();
  }

  async save(r: Risk): Promise<void> {
    await this.repo.save(this.repo.create({
      id: r.id, projectId: r.projectId, title: r.title, description: r.description, category: r.category, status: r.status,
      responsibleId: r.responsibleId, mitigationPlan: r.mitigationPlan, identifiedBy: r.identifiedBy, score: r.score, level: r.level,
      createdAt: r.createdAt,
      assessments: r.assessments.map((a) => Object.assign(new RiskAssessmentOrmEntity(), { ...a, riskId: r.id })),
    }));
  }

  async findById(id: string) {
    const e = await this.repo.findOne({ where: { id } });
    return e ? toDomain(e) : null;
  }

  async findByProject(projectId: string) {
    return (await this.repo.find({ where: { projectId } })).map(toDomain);
  }

  async findOpen() {
    return (await this.repo.find({ where: { status: In(OPEN_RISK_STATUSES) } })).map(toDomain);
  }
}
