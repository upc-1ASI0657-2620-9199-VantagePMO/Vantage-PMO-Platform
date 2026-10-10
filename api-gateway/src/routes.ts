export type ServiceName = 'iam' | 'projectTask';

export interface RouteDefinition {
  /** Path prefix exposed by the gateway (kept identical in the downstream service). */
  prefix: string;
  service: ServiceName;
  /** Public routes do not require a JWT (e.g. sign-in / sign-up). */
  isPublic: boolean;
}

/** Routing table of the API Gateway: one entry per resource exposed by a bounded context. */
export const ROUTES: RouteDefinition[] = [
  { prefix: '/api/v1/authentication', service: 'iam', isPublic: true },
  { prefix: '/api/v1/users', service: 'iam', isPublic: false },
  { prefix: '/api/v1/projects', service: 'projectTask', isPublic: false },
  { prefix: '/api/v1/tasks', service: 'projectTask', isPublic: false },
];

export function resolveRoute(path: string, routes: RouteDefinition[] = ROUTES): RouteDefinition | undefined {
  return routes.find((r) => path === r.prefix || path.startsWith(`${r.prefix}/`));
}
