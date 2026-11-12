import { randomUUID } from 'crypto';
import { DomainError } from '../../../../shared/domain/domain-error';
import { RiskAssessment } from '../entities/risk-assessment';
import { RiskLevel, RiskScore } from '../value-objects/risk-score';
import { OPEN_RISK_STATUSES, RISK_STATUS_TRANSITIONS, RiskCategory, RiskStatus } from '../value-objects/risk-status';

interface RiskProps {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  category: RiskCategory;
  status: RiskStatus;
  responsibleId: string | null;
  mitigationPlan: string | null;
  identifiedBy: string;
  assessments: RiskAssessment[];
  createdAt: Date;
  updatedAt: Date;
}

/** Aggregate root of Risk Management (US28, US29): a project risk with its evaluation history. */
export class Risk {
  private constructor(private props: RiskProps) {}

  static register(params: {
    projectId: string; title: string; description?: string | null; category: RiskCategory; probability: number; impact: number;
    responsibleId?: string | null; mitigationPlan?: string | null; identifiedBy: string;
  }): Risk {
    const now = new Date();
    const risk = new Risk({
      id: randomUUID(),
      projectId: params.projectId,
      title: Risk.requireText(params.title, 'title', 150),
      description: params.description?.trim() || null,
      category: params.category,
      status: RiskStatus.IDENTIFIED,
      responsibleId: params.responsibleId ?? null,
      mitigationPlan: params.mitigationPlan?.trim() || null,
      identifiedBy: params.identifiedBy,
      assessments: [],
      createdAt: now,
      updatedAt: now,
    });
    risk.assess(params.probability, params.impact, 'Evaluación inicial', params.identifiedBy);
    return risk;
  }

  static restore(props: RiskProps): Risk {
    return new Risk({ ...props, assessments: [...props.assessments].sort((a, b) => a.number - b.number) });
  }

  /** US29: re-evaluates probability and impact; the history keeps every evaluation. */
  reassess(probability: number, impact: number, note: string | null, assessedBy: string): RiskAssessment {
    if (this.props.status === RiskStatus.CLOSED) throw new DomainError('A closed risk cannot be re-evaluated.', 'risk-closed');
    return this.assess(probability, impact, note, assessedBy);
  }

  changeStatus(status: RiskStatus, mitigationPlan?: string | null): void {
    if (status === this.props.status) return;
    if (!RISK_STATUS_TRANSITIONS[this.props.status].includes(status)) {
      throw new DomainError(`A risk cannot move from ${this.props.status} to ${status}.`, 'invalid-risk-transition');
    }
    if (mitigationPlan?.trim()) this.props.mitigationPlan = mitigationPlan.trim();
    if (status === RiskStatus.MITIGATING && !this.props.mitigationPlan) {
      throw new DomainError('A mitigation plan is required to start mitigating the risk.', 'mitigation-plan-required');
    }
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  private assess(probability: number, impact: number, note: string | null, assessedBy: string): RiskAssessment {
    const score = RiskScore.of(probability, impact);
    const assessment: RiskAssessment = {
      number: this.props.assessments.length + 1,
      probability, impact, score: score.value, level: score.level,
      note: note?.trim() || null, assessedBy, assessedAt: new Date(),
    };
    this.props.assessments.push(assessment);
    this.props.updatedAt = assessment.assessedAt;
    return assessment;
  }

  private static requireText(value: string, field: string, max: number): string {
    const v = (value ?? '').trim();
    if (!v) throw new DomainError(`The risk ${field} is required.`, `risk-${field}-required`);
    if (v.length > max) throw new DomainError(`The risk ${field} must have at most ${max} characters.`, `risk-${field}-too-long`);
    return v;
  }

  get current(): RiskAssessment { return this.props.assessments[this.props.assessments.length - 1]; }
  get score(): number { return this.current.score; }
  get level(): RiskLevel { return this.current.level; }
  get isOpen(): boolean { return OPEN_RISK_STATUSES.includes(this.props.status); }
  /** US30: open risks with critical severity are highlighted. */
  get isCritical(): boolean { return this.isOpen && this.level === RiskLevel.CRITICAL; }

  get id() { return this.props.id; }
  get projectId() { return this.props.projectId; }
  get title() { return this.props.title; }
  get description() { return this.props.description; }
  get category() { return this.props.category; }
  get status() { return this.props.status; }
  get responsibleId() { return this.props.responsibleId; }
  get mitigationPlan() { return this.props.mitigationPlan; }
  get identifiedBy() { return this.props.identifiedBy; }
  get assessments(): readonly RiskAssessment[] { return this.props.assessments; }
  get createdAt() { return this.props.createdAt; }
  get updatedAt() { return this.props.updatedAt; }
}
