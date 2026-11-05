import { DomainError } from '../../../../shared/domain/domain-error';

/** Value Object: share of a member's working time dedicated to a project (1-100 %). */
export class AllocationPercentage {
  private constructor(public readonly value: number) {}

  static of(value: number): AllocationPercentage {
    if (!Number.isInteger(value) || value < 1 || value > 100) {
      throw new DomainError('The allocation must be an integer percentage between 1 and 100.', 'invalid-allocation');
    }
    return new AllocationPercentage(value);
  }
}
