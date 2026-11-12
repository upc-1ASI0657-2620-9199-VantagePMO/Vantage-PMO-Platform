export const ConsumedEvents = {
  PROJECT_REGISTERED: 'projects.project-registered',
  PROJECT_UPDATED: 'projects.project-updated',
  PROJECT_STATUS_CHANGED: 'projects.project-status-changed',
} as const;

export const RiskEvents = {
  RISK_REGISTERED: 'risks.risk-registered',
  CRITICAL_RISK_IDENTIFIED: 'risks.critical-risk-identified',
} as const;

export interface CriticalRiskPayload {
  riskId: string;
  projectId: string;
  projectName: string;
  ownerId: string;
  responsibleId: string | null;
  title: string;
  probability: number;
  impact: number;
  score: number;
}
