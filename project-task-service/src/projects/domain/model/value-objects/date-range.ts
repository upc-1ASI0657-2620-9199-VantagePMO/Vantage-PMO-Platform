import { DomainError } from '../../../../shared/domain/domain-error';

/**
 * Value Object: immutable period [startDate, endDate] expressed as ISO dates (YYYY-MM-DD).
 * Invariant: endDate can never be before startDate.
 */
export class DateRange {
  private constructor(
    public readonly startDate: string,
    public readonly endDate: string,
  ) {}

  static of(startDate: string, endDate: string): DateRange {
    const start = DateRange.normalize(startDate, 'startDate');
    const end = DateRange.normalize(endDate, 'endDate');
    if (end < start) {
      throw new DomainError('The project end date cannot be before its start date.', 'invalid-date-range');
    }
    return new DateRange(start, end);
  }

  contains(date: string): boolean {
    const value = DateRange.normalize(date, 'date');
    return value >= this.startDate && value <= this.endDate;
  }

  static normalize(value: string, field: string): string {
    const parsed = new Date(value);
    if (!value || Number.isNaN(parsed.getTime())) {
      throw new DomainError(`'${field}' must be a valid ISO date (YYYY-MM-DD).`, 'invalid-date');
    }
    return parsed.toISOString().substring(0, 10);
  }
}
