import { RiskLevel } from '../value-objects/risk-score';

/** Entity inside the Risk aggregate: one evaluation of probability and impact (history for US29). */
export interface RiskAssessment {
  number: number;
  probability: number;
  impact: number;
  score: number;
  level: RiskLevel;
  note: string | null;
  assessedBy: string;
  assessedAt: Date;
}
