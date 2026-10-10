import { UserCommandService } from '../../src/iam/application/internal/command-services/user-command.service';
import { HashingService } from '../../src/iam/application/internal/outbound-services/hashing.service';
import { IssuedToken, TokenService } from '../../src/iam/application/internal/outbound-services/token.service';
import { User } from '../../src/iam/domain/model/aggregates/user';
import { SignInCommand, SignUpCommand } from '../../src/iam/domain/model/commands/iam-commands';
import { Role } from '../../src/iam/domain/model/value-objects/role';
import { UserRepository } from '../../src/iam/domain/repositories/user.repository';
import { BcryptHashingService } from '../../src/iam/infrastructure/hashing/bcrypt-hashing.service';
import { ConflictError, DomainError, InvalidCredentialsError } from '../../src/shared/domain/domain-error';

/** In-memory test double of the repository port (Testability tactic). */
class InMemoryUserRepository extends UserRepository {
  readonly users = new Map<string, User>();
  async save(user: User) { this.users.set(user.id, user); }
  async findById(id: string) { return this.users.get(id) ?? null; }
  async findByEmail(email: string) { return [...this.users.values()].find((u) => u.email === email) ?? null; }
  async existsByEmail(email: string) { return (await this.findByEmail(email)) !== null; }
  async findAll() { return [...this.users.values()]; }
}

class FakeTokenService extends TokenService {
  issue(user: User): IssuedToken { return { token: `token-for-${user.id}`, expiresIn: 3600 }; }
}

describe('UserCommandService', () => {
  let repo: InMemoryUserRepository;
  let hashing: HashingService;
  let service: UserCommandService;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    hashing = new BcryptHashingService();
    service = new UserCommandService(repo, hashing, new FakeTokenService());
  });

  it('stores only a BCrypt hash, never the plain password (US51)', async () => {
    const user = await service.handleSignUp(new SignUpCommand('Katherine Herrera', 'Kath@Vantage.pe', 'Segura2026', Role.PMO_LEAD));
    expect(user.email).toBe('kath@vantage.pe');
    expect(user.passwordHash).not.toBe('Segura2026');
    expect(user.passwordHash).toMatch(/^\$2[aby]\$10\$/);
    expect(await hashing.verify('Segura2026', user.passwordHash)).toBe(true);
  });

  it('rejects duplicated e-mails', async () => {
    await service.handleSignUp(new SignUpCommand('A', 'a@vantage.pe', 'Segura2026'));
    await expect(service.handleSignUp(new SignUpCommand('B', 'A@vantage.pe', 'Segura2026'))).rejects.toBeInstanceOf(ConflictError);
  });

  it('rejects weak passwords and the ADMIN role on self sign-up', async () => {
    await expect(service.handleSignUp(new SignUpCommand('A', 'a@vantage.pe', 'short'))).rejects.toThrow('at least 8 characters');
    await expect(service.handleSignUp(new SignUpCommand('A', 'a@vantage.pe', 'Segura2026', Role.ADMIN))).rejects.toBeInstanceOf(DomainError);
  });

  it('issues a token for valid credentials (US20, US41)', async () => {
    const created = await service.handleSignUp(new SignUpCommand('Valentín', 'valentin@vantage.pe', 'Segura2026'));
    const { user, token } = await service.handleSignIn(new SignInCommand('VALENTIN@vantage.pe', 'Segura2026'));
    expect(user.id).toBe(created.id);
    expect(token.token).toBe(`token-for-${created.id}`);
  });

  it('rejects invalid credentials without revealing which field failed', async () => {
    await service.handleSignUp(new SignUpCommand('Valentín', 'valentin@vantage.pe', 'Segura2026'));
    await expect(service.handleSignIn(new SignInCommand('valentin@vantage.pe', 'Otra2026'))).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(service.handleSignIn(new SignInCommand('nadie@vantage.pe', 'Segura2026'))).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
