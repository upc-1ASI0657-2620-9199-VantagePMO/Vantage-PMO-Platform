import { Injectable } from '@nestjs/common';
import { ResourceNotFoundError } from '../../../../shared/domain/domain-error';
import { Risk } from '../../../domain/model/aggregates/risk';
import { ProjectReference } from '../../../domain/model/entities/project-reference';
import { GetPriorityRisksQuery, GetProjectRisksQuery, GetRiskQuery } from '../../../domain/model/queries/risk-queries';
import { ProjectReferenceRepository } from '../../../domain/repositories/project-reference.repository';
import { RiskRepository } from '../../../domain/repositories/risk.repository';
import { RiskPrioritizationPolicy } from '../../../domain/services/risk-prioritization-policy';

/** Read use cases of Risk Management (US30, US55). */
@Injectable()
export class RiskQueryService {
  constructor(
    private readonly risks: RiskRepository,
    private readonly projects: ProjectReferenceRepository,
  ) {}

  async handleGetByProject(q: GetProjectRisksQuery): Promise<Risk[]> {
    if (!(await this.projects.findById(q.projectId))) throw new ResourceNotFoundError('Project', q.projectId);
    let risks = await this.risks.findByProject(q.projectId);
    if (q.status) risks = risks.filter((r) => r.status === q.status);
    if (q.minLevel) risks = RiskPrioritizationPolicy.atLeast(risks, q.minLevel);
    return RiskPrioritizationPolicy.sort(risks);
  }

  async handleGet(q: GetRiskQuery): Promise<Risk> {
    const risk = await this.risks.findById(q.riskId);
    if (!risk) throw new ResourceNotFoundError('Risk', q.riskId);
    return risk;
  }

  /** US30: open risks of the whole portfolio at or above a severity level, most severe first. */
  async handleGetPriority(q: GetPriorityRisksQuery): Promise<{ risks: Risk[]; projects: Map<string, ProjectReference> }> {
    const risks = RiskPrioritizationPolicy.sort(RiskPrioritizationPolicy.atLeast(await this.risks.findOpen(), q.minLevel));
    const projects = new Map((await this.projects.findByIds([...new Set(risks.map((r) => r.projectId))])).map((p) => [p.id, p]));
    return { risks, projects };
  }
}
