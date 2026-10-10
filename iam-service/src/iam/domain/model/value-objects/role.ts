/** Roles used for authorization across Vantage PMO (RBAC is extended in a later sprint, US34). */
export enum Role {
  ADMIN = 'ADMIN',
  PMO_LEAD = 'PMO_LEAD',
  PROJECT_MANAGER = 'PROJECT_MANAGER',
  MEMBER = 'MEMBER',
}

/** Roles a user can choose when self-registering; ADMIN can only be granted internally. */
export const SELF_ASSIGNABLE_ROLES: Role[] = [Role.PMO_LEAD, Role.PROJECT_MANAGER, Role.MEMBER];
