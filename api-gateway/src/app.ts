import express, { Express } from 'express';
import { randomUUID } from 'crypto';
import { authMiddleware } from './auth.middleware';
import { GatewayConfig } from './config';
import { docsRouter } from './docs';
import { sendProblem } from './problem';
import { ServiceProxy } from './proxy';
import { resolveRoute, ServiceName } from './routes';

export function createApp(config: GatewayConfig): { app: Express; proxies: Record<ServiceName, ServiceProxy> } {
  const app = express();
  const options = { timeoutMs: config.upstreamTimeoutMs, resetMs: config.breakerResetMs };
  const proxies: Record<ServiceName, ServiceProxy> = {
    iam: new ServiceProxy('IAM Service', config.services.iam, options),
    projectTask: new ServiceProxy('Project & Task Service', config.services.projectTask, options),
  };

  app.disable('x-powered-by');
  app.set('trust proxy', true);

  // Correlation id + access log
  app.use((req, res, next) => {
    const requestId = (req.headers['x-request-id'] as string) || randomUUID();
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    const started = Date.now();
    res.on('finish', () => console.log(`[gateway] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - started} ms) id=${requestId}`));
    next();
  });

  // CORS for the Vue.js SPA
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Request-Id');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.get('/', (_req, res) => res.redirect('/swagger'));
  app.use(docsRouter(config));

  app.get('/health', async (_req, res) => {
    const check = async (name: ServiceName, url: string) => {
      try {
        const r = await fetch(`${url}/health`, { signal: AbortSignal.timeout(3000) });
        return { status: r.ok ? 'UP' : 'DOWN', circuit: proxies[name].state };
      } catch {
        return { status: 'DOWN', circuit: proxies[name].state };
      }
    };
    const services = {
      iam: await check('iam', config.services.iam),
      projectTask: await check('projectTask', config.services.projectTask),
    };
    const allUp = Object.values(services).every((s) => s.status === 'UP');
    res.status(allUp ? 200 : 207).json({ service: 'api-gateway', status: allUp ? 'UP' : 'DEGRADED', services });
  });

  app.use(express.raw({ type: '*/*', limit: '10mb' }));
  app.use(authMiddleware(config.jwtSecret));
  app.use((req, res) => {
    const route = resolveRoute(req.path);
    if (!route) return sendProblem(res, 404, 'Not Found', `No route matches ${req.method} ${req.path}.`);
    return proxies[route.service].handle(req, res);
  });

  return { app, proxies };
}
