import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Identity propagated by the IAM Service inside the signed JWT. */
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: string;
}

/** Injects the authenticated user (resolved by JwtAuthGuard) into a controller method. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser =>
    ctx.switchToHttp().getRequest().user,
);
