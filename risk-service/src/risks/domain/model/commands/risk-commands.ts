import { RiskCategory, RiskStatus } from '../value-objects/risk-status';

export class RegisterRiskCommand {
  constructor(
    public readonly projectId: string,
    public readonly title: string,
    public readonly description: string | undefined,
    public readonly category: RiskCategory,
    public readonly probability: number,
    public readonly impact: number,
    public readonly responsibleId: string | undefined,
    public readonly mitigationPlan: string | undefined,
    public readonly identifiedBy: string,
  ) {}
}

export class ReassessRiskCommand {
  constructor(
    public readonly riskId: string,
    public readonly probability: number,
    public readonly impact: number,
    public readonly note: string | undefined,
    public readonly assessedBy: string,
  ) {}
}

export class ChangeRiskStatusCommand {
  constructor(public readonly riskId: string, public readonly status: RiskStatus, public readonly mitigationPlan?: string) {}
}
