import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { User } from '../../src/iam/domain/model/aggregates/user';
import { Role } from '../../src/iam/domain/model/value-objects/role';
import { JwtTokenService } from '../../src/iam/infrastructure/tokens/jwt-token.service';

describe('JwtTokenService', () => {
  it('signs a JWT with subject, e-mail, role and expiration (US41)', () => {
    const config = new ConfigService({ JWT_SECRET: 'test-secret', JWT_EXPIRES_IN: 600 });
    const user = User.register('Mike Guillen', 'mike@vantage.pe', '$2a$10$hash', Role.PROJECT_MANAGER);
    const issued = new JwtTokenService(config).issue(user);
    const payload = jwt.verify(issued.token, 'test-secret') as jwt.JwtPayload;
    expect(payload.sub).toBe(user.id);
    expect(payload.role).toBe('PROJECT_MANAGER');
    expect(payload.iss).toBe('vantage-pmo-iam');
    expect(payload.exp! - payload.iat!).toBe(600);
    expect(issued.expiresIn).toBe(600);
  });
});
