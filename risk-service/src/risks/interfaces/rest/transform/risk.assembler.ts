import { Risk } from '../../../domain/model/aggregates/risk';
import { RiskDetailResource, RiskResource } from '../resources/risk.resources';

export class RiskAssembler {
  static toResource(r: Risk, projectName?: string): RiskResource {
    return {
      id: r.id, projectId: r.projectId, projectName, title: r.title, description: r.description, category: r.category, status: r.status,
      probability: r.current.probability, impact: r.current.impact, score: r.score, level: r.level, highlighted: r.isCritical,
      responsibleId: r.responsibleId, mitigationPlan: r.mitigationPlan, updatedAt: new Date(r.updatedAt).toISOString(),
    };
  }

  static toDetail(r: Risk): RiskDetailResource {
    return {
      ...RiskAssembler.toResource(r),
      assessments: r.assessments.map((a) => ({ ...a, assessedAt: new Date(a.assessedAt).toISOString() })),
    };
  }
}
