import { Risk } from '../model/aggregates/risk';

export abstract class RiskRepository {
  abstract save(risk: Risk): Promise<void>;
  abstract findById(id: string): Promise<Risk | null>;
  abstract findByProject(projectId: string): Promise<Risk[]>;
  abstract findOpen(): Promise<Risk[]>;
}
