import { Risk } from '../model/aggregates/risk';
import { RiskLevel, RiskScore } from '../model/value-objects/risk-score';

/**
 * Domain service (US30, US55): orders risks so that the most severe ones come first.
 * Order: open before closed, score desc, impact desc, probability desc, oldest first.
 */
export class RiskPrioritizationPolicy {
  static sort(risks: Risk[]): Risk[] {
    return [...risks].sort((a, b) =>
      Number(b.isOpen) - Number(a.isOpen)
      || b.score - a.score
      || b.current.impact - a.current.impact
      || b.current.probability - a.current.probability
      || a.createdAt.getTime() - b.createdAt.getTime());
  }

  static atLeast(risks: Risk[], minLevel: RiskLevel): Risk[] {
    return risks.filter((r) => RiskScore.rank(r.level) >= RiskScore.rank(minLevel));
  }
}
