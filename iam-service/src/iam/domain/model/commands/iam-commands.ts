import { Role } from '../value-objects/role';

export class SignUpCommand {
  constructor(
    public readonly fullName: string,
    public readonly email: string,
    public readonly password: string,
    public readonly role: Role = Role.MEMBER,
  ) {}
}

export class SignInCommand {
  constructor(public readonly email: string, public readonly password: string) {}
}
