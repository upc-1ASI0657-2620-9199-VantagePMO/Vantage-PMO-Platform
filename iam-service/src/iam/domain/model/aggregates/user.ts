import { randomUUID } from 'crypto';
import { DomainError } from '../../../../shared/domain/domain-error';
import { EmailAddress } from '../value-objects/email-address';
import { Role } from '../value-objects/role';

export interface UserProps {
  id: string;
  fullName: string;
  email: EmailAddress;
  passwordHash: string;
  role: Role;
  createdAt: Date;
}

/** Aggregate Root of the IAM bounded context. It never holds a plain-text password (US51). */
export class User {
  private constructor(private readonly props: UserProps) {}

  static register(fullName: string, email: string, passwordHash: string, role: Role): User {
    const name = (fullName ?? '').trim();
    if (!name) throw new DomainError('The full name is required.', 'invalid-user');
    if (name.length > 120) throw new DomainError('The full name cannot exceed 120 characters.', 'invalid-user');
    if (!passwordHash) throw new DomainError('A password hash is required.', 'invalid-user');
    return new User({ id: randomUUID(), fullName: name, email: EmailAddress.of(email), passwordHash, role, createdAt: new Date() });
  }

  static restore(props: UserProps): User {
    return new User(props);
  }

  get id(): string { return this.props.id; }
  get fullName(): string { return this.props.fullName; }
  get email(): string { return this.props.email.value; }
  get passwordHash(): string { return this.props.passwordHash; }
  get role(): Role { return this.props.role; }
  get createdAt(): Date { return this.props.createdAt; }
}
