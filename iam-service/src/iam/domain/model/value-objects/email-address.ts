import { DomainError } from '../../../../shared/domain/domain-error';

/** Value Object: normalized (trimmed, lower-case) e-mail address. */
export class EmailAddress {
  private static readonly PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  private constructor(public readonly value: string) {}

  static of(raw: string): EmailAddress {
    const value = (raw ?? '').trim().toLowerCase();
    if (!EmailAddress.PATTERN.test(value) || value.length > 120) {
      throw new DomainError('The e-mail address is not valid.', 'invalid-email');
    }
    return new EmailAddress(value);
  }
}
