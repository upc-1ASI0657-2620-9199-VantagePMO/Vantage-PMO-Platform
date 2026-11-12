import { DomainError } from '../../../../shared/domain/domain-error';

export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

const LEVEL_ORDER: Record<RiskLevel, number> = { LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 };

/**
 * Value Object (US28): severity of a risk on a 5x5 probability-impact matrix.
 * score = probability x impact (1-25) -> LOW 1-4, MEDIUM 5-9, HIGH 10-14, CRITICAL 15-25.
 */
export class RiskScore {
  private constructor(
    public readonly probability: number,
    public readonly impact: number,
  ) {}

  static of(probability: number, impact: number): RiskScore {
    for (const [field, value] of [['probability', probability], ['impact', impact]] as const) {
      if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new DomainError(`The ${field} must be an integer from 1 (very low) to 5 (very high).`, 'invalid-risk-scale');
      }
    }
    return new RiskScore(probability, impact);
  }

  get value(): number {
    return this.probability * this.impact;
  }

  get level(): RiskLevel {
    const v = this.value;
    if (v >= 15) return RiskLevel.CRITICAL;
    if (v >= 10) return RiskLevel.HIGH;
    if (v >= 5) return RiskLevel.MEDIUM;
    return RiskLevel.LOW;
  }

  static rank(level: RiskLevel): number {
    return LEVEL_ORDER[level];
  }
}
