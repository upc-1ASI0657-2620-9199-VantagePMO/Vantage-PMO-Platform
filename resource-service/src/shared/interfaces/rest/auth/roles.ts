import { ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from './authenticated-user';

/** Roles allowed to manage team allocations (PMO and project managers). */
export const RESOURCE_MANAGERS = ['ADMIN', 'PMO_LEAD', 'PROJECT_MANAGER'];

export function ensureRole(user: AuthenticatedUser, roles: string[]): void {
  if (!roles.includes(user.role)) throw new ForbiddenException(`This operation requires one of the roles: ${roles.join(', ')}.`);
}
