import { Router } from 'express';
import swaggerUi from 'swagger-ui-express';
import { GatewayConfig } from './config';

/**
 * Aggregated OpenAPI documentation: the gateway fetches each microservice's OpenAPI document,
 * points its "servers" to the gateway public URL and shows all of them in a single Swagger UI.
 */
export function docsRouter(config: GatewayConfig): Router {
  const router = Router();
  const specs: Record<string, { title: string; url: string }> = {
    iam: { title: 'IAM Service', url: `${config.services.iam}/swagger/json` },
    'project-task': { title: 'Project & Task Service', url: `${config.services.projectTask}/swagger/json` },
  };

  router.get('/docs/:service.json', async (req, res) => {
    const spec = specs[req.params.service];
    if (!spec) return res.status(404).json({ detail: 'Unknown service' });
    try {
      const response = await fetch(spec.url, { signal: AbortSignal.timeout(config.upstreamTimeoutMs) });
      const document = await response.json();
      document.servers = [{ url: config.publicUrl, description: 'Vantage PMO API Gateway' }];
      res.json(document);
    } catch {
      res.status(503).json({ detail: `${spec.title} documentation is not available.` });
    }
  });

  router.use(
    '/swagger',
    swaggerUi.serve,
    swaggerUi.setup(undefined, {
      customSiteTitle: 'Vantage PMO API',
      explorer: true,
      swaggerOptions: {
        urls: Object.entries(specs).map(([key, s]) => ({ name: s.title, url: `/docs/${key}.json` })),
        persistAuthorization: true,
      },
    }),
  );
  return router;
}
