import { Injectable, Logger } from '@nestjs/common';
import { ConflictError, DomainError, InvalidCredentialsError } from '../../../../shared/domain/domain-error';
import { User } from '../../../domain/model/aggregates/user';
import { SignInCommand, SignUpCommand } from '../../../domain/model/commands/iam-commands';
import { SELF_ASSIGNABLE_ROLES } from '../../../domain/model/value-objects/role';
import { EmailAddress } from '../../../domain/model/value-objects/email-address';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { HashingService } from '../outbound-services/hashing.service';
import { IssuedToken, TokenService } from '../outbound-services/token.service';

/** Write use cases of the IAM bounded context: sign-up (US51) and sign-in (US20, US41). */
@Injectable()
export class UserCommandService {
  private readonly logger = new Logger(UserCommandService.name);

  constructor(
    private readonly users: UserRepository,
    private readonly hashing: HashingService,
    private readonly tokens: TokenService,
  ) {}

  async handleSignUp(command: SignUpCommand): Promise<User> {
    if (!SELF_ASSIGNABLE_ROLES.includes(command.role)) {
      throw new DomainError(`Role ${command.role} cannot be self-assigned.`, 'role-not-allowed');
    }
    UserCommandService.ensureStrongPassword(command.password);
    const email = EmailAddress.of(command.email).value;
    if (await this.users.existsByEmail(email)) {
      throw new ConflictError(`A user with e-mail '${email}' already exists.`);
    }
    const user = User.register(command.fullName, email, await this.hashing.hash(command.password), command.role);
    await this.users.save(user);
    this.logger.log(`User ${user.id} registered with role ${user.role}`);
    return user;
  }

  async handleSignIn(command: SignInCommand): Promise<{ user: User; token: IssuedToken }> {
    const user = await this.users.findByEmail((command.email ?? '').trim().toLowerCase());
    if (!user || !(await this.hashing.verify(command.password, user.passwordHash))) {
      // QAS-05: failed attempts are logged for audit without revealing which field was wrong.
      this.logger.warn(`Failed sign-in attempt for '${command.email}'`);
      throw new InvalidCredentialsError();
    }
    return { user, token: this.tokens.issue(user) };
  }

  private static ensureStrongPassword(password: string): void {
    if (!password || password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      throw new DomainError('The password must have at least 8 characters, including letters and numbers.', 'weak-password');
    }
  }
}
