import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { User } from '../../domain/model/aggregates/user';
import { IssuedToken, TokenService } from '../../application/internal/outbound-services/token.service';

@Injectable()
export class JwtTokenService extends TokenService {
  constructor(private readonly config: ConfigService) {
    super();
  }

  issue(user: User): IssuedToken {
    const expiresIn = Number(this.config.get('JWT_EXPIRES_IN', 3600));
    const token = jwt.sign({ email: user.email, role: user.role, name: user.fullName }, this.config.getOrThrow<string>('JWT_SECRET'), {
      subject: user.id,
      issuer: 'vantage-pmo-iam',
      expiresIn,
    });
    return { token, expiresIn };
  }
}
