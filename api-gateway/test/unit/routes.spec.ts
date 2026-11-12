import { resolveRoute } from '../../src/routes';

describe('Gateway routing table', () => {
  it.each([
    ['/api/v1/authentication/sign-in', 'iam', true],
    ['/api/v1/users/me', 'iam', false],
    ['/api/v1/projects', 'projectTask', false],
    ['/api/v1/projects/123/tasks', 'projectTask', false],
    ['/api/v1/tasks/123/completion', 'projectTask', false],
    ['/api/v1/alerts/scan', 'projectTask', false],
    ['/api/v1/projects/123/allocations', 'resource', false],
    ['/api/v1/allocations/456', 'resource', false],
    ['/api/v1/resources/availability', 'resource', false],
    ['/api/v1/notifications/unread-count', 'notification', false],
    ['/api/v1/projects/123/documents', 'document', false],
    ['/api/v1/projects/123/milestones/456/document-requirements', 'document', false],
    ['/api/v1/projects/123/milestones/456/completion', 'projectTask', false],
    ['/api/v1/documents/789/content', 'document', false],
    ['/api/v1/document-requirements/789', 'document', false],
    ['/api/v1/projects/123/risks', 'risk', false],
    ['/api/v1/risks/priority', 'risk', false],
  ])('routes %s to %s (public=%s)', (path, service, isPublic) => {
    const route = resolveRoute(path);
    expect(route?.service).toBe(service);
    expect(route?.isPublic).toBe(isPublic);
  });

  it('does not match partial prefixes', () => {
    expect(resolveRoute('/api/v1/projectsX')).toBeUndefined();
    expect(resolveRoute('/api/v2/projects')).toBeUndefined();
  });
});
