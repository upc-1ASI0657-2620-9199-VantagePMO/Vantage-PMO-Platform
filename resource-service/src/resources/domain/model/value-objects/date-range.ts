import { DomainError } from '../../../../shared/domain/domain-error';

/** Value Object: allocation period [startDate, endDate] as ISO dates (YYYY-MM-DD). */
export class DateRange {
  private constructor(
    public readonly startDate: string,
    public readonly endDate: string,
  ) {}

  static of(startDate: string, endDate: string): DateRange {
    const start = DateRange.normalize(startDate, 'startDate');
    const end = DateRange.normalize(endDate, 'endDate');
    if (end < start) throw new DomainError('The allocation end date cannot be before its start date.', 'invalid-date-range');
    return new DateRange(start, end);
  }

  overlaps(other: DateRange): boolean {
    return this.startDate <= other.endDate && other.startDate <= this.endDate;
  }

  isWithin(other: DateRange): boolean {
    return this.startDate >= other.startDate && this.endDate <= other.endDate;
  }

  static normalize(value: string, field: string): string {
    const parsed = new Date(value);
    if (!value || Number.isNaN(parsed.getTime())) throw new DomainError(`'${field}' must be a valid ISO date (YYYY-MM-DD).`, 'invalid-date');
    return parsed.toISOString().substring(0, 10);
  }
}
