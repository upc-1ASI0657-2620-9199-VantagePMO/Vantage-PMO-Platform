export type ServiceName = 'iam' | 'projectTask' | 'resource' | 'notification' | 'document' | 'risk';

export interface RouteDefinition {
  /** Path prefix, or a regular expression for nested resources owned by another service. */
  prefix: string | RegExp;
  service: ServiceName;
  isPublic: boolean;
}

/**
 * Routing table of the API Gateway. Order matters: more specific routes go first
 * (e.g. the allocations of a project belong to Resource Management, not to Project & Task).
 */
export const ROUTES: RouteDefinition[] = [
  { prefix: '/api/v1/authentication', service: 'iam', isPublic: true },
  { prefix: '/api/v1/users', service: 'iam', isPublic: false },
  { prefix: /^\/api\/v1\/projects\/[^/]+\/allocations(\/.*)?$/, service: 'resource', isPublic: false },
  { prefix: /^\/api\/v1\/projects\/[^/]+\/documents(\/.*)?$/, service: 'document', isPublic: false },
  { prefix: /^\/api\/v1\/projects\/[^/]+\/milestones\/[^/]+\/document-requirements(\/.*)?$/, service: 'document', isPublic: false },
  { prefix: /^\/api\/v1\/projects\/[^/]+\/risks(\/.*)?$/, service: 'risk', isPublic: false },
  { prefix: '/api/v1/projects', service: 'projectTask', isPublic: false },
  { prefix: '/api/v1/tasks', service: 'projectTask', isPublic: false },
  { prefix: '/api/v1/alerts', service: 'projectTask', isPublic: false },
  { prefix: '/api/v1/allocations', service: 'resource', isPublic: false },
  { prefix: '/api/v1/resources', service: 'resource', isPublic: false },
  { prefix: '/api/v1/notifications', service: 'notification', isPublic: false },
  { prefix: '/api/v1/documents', service: 'document', isPublic: false },
  { prefix: '/api/v1/document-requirements', service: 'document', isPublic: false },
  { prefix: '/api/v1/risks', service: 'risk', isPublic: false },
];

export function resolveRoute(path: string, routes: RouteDefinition[] = ROUTES): RouteDefinition | undefined {
  return routes.find((r) =>
    typeof r.prefix === 'string' ? path === r.prefix || path.startsWith(`${r.prefix}/`) : r.prefix.test(path),
  );
}
