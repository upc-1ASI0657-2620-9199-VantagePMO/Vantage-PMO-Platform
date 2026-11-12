import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from './authenticated-user';

/** Roles allowed to define mandatory documents (PMO and project managers). */
export const PROJECT_MANAGERS = ['ADMIN', 'PMO_LEAD', 'PROJECT_MANAGER'];

export function ensureRole(user: AuthenticatedUser, roles: string[]): void {
  if (!roles.includes(user.role)) throw new ForbiddenException(`This operation requires one of the roles: ${roles.join(', ')}.`);
}
