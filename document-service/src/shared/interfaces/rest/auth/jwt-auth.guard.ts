import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { AuthenticatedUser } from './authenticated-user';

/**
 * Defense in depth: the API Gateway already validates the token, but every
 * microservice verifies it again so that internal calls are authenticated too
 * (Architectural Concern: service-to-service security).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers['authorization'];
    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing bearer token.');
    }
    try {
      const payload = jwt.verify(header.substring(7), this.config.getOrThrow<string>('JWT_SECRET')) as jwt.JwtPayload;
      const user: AuthenticatedUser = { id: String(payload.sub), email: payload.email, role: payload.role };
      request.user = user;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token.');
    }
  }
}
