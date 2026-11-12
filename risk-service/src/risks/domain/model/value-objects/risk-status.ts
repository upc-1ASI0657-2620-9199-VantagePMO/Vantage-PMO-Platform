/** Life cycle of a risk (US29). */
export enum RiskStatus {
  IDENTIFIED = 'IDENTIFIED',
  MITIGATING = 'MITIGATING',
  MITIGATED = 'MITIGATED',
  OCCURRED = 'OCCURRED',
  CLOSED = 'CLOSED',
}

export const RISK_STATUS_TRANSITIONS: Record<RiskStatus, RiskStatus[]> = {
  IDENTIFIED: [RiskStatus.MITIGATING, RiskStatus.OCCURRED, RiskStatus.CLOSED],
  MITIGATING: [RiskStatus.MITIGATED, RiskStatus.OCCURRED, RiskStatus.CLOSED],
  MITIGATED: [RiskStatus.MITIGATING, RiskStatus.CLOSED],
  OCCURRED: [RiskStatus.CLOSED],
  CLOSED: [],
};

/** Statuses in which a risk still needs attention. */
export const OPEN_RISK_STATUSES = [RiskStatus.IDENTIFIED, RiskStatus.MITIGATING, RiskStatus.OCCURRED];

export enum RiskCategory {
  TECHNICAL = 'TECHNICAL',
  SCHEDULE = 'SCHEDULE',
  COST = 'COST',
  SCOPE = 'SCOPE',
  RESOURCES = 'RESOURCES',
  EXTERNAL = 'EXTERNAL',
}
