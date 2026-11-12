import { RiskLevel } from '../value-objects/risk-score';
import { RiskStatus } from '../value-objects/risk-status';

export class GetProjectRisksQuery {
  constructor(public readonly projectId: string, public readonly status?: RiskStatus, public readonly minLevel?: RiskLevel) {}
}

export class GetRiskQuery {
  constructor(public readonly riskId: string) {}
}

export class GetPriorityRisksQuery {
  constructor(public readonly minLevel: RiskLevel = RiskLevel.HIGH) {}
}
