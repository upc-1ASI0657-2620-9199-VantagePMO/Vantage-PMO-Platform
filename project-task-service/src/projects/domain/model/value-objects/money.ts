import { DomainError } from '../../../../shared/domain/domain-error';

/** Value Object: non-negative monetary amount with 2 decimals (PEN by default). */
export class Money {
  private constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {}

  static of(amount: number, currency = 'PEN'): Money {
    if (!Number.isFinite(amount) || amount < 0) {
      throw new DomainError('The budget must be a non-negative amount.', 'invalid-budget');
    }
    return new Money(Math.round(amount * 100) / 100, currency);
  }
}
