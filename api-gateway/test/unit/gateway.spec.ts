import { createServer, Server } from 'http';
import { AddressInfo } from 'net';
import * as jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../../src/app';
import { GatewayConfig } from '../../src/config';

const SECRET = 'test-secret';
const token = jwt.sign({ sub: 'user-1', role: 'PROJECT_MANAGER' }, SECRET);

function startUpstream(handler: (status: { code: number }) => void): Promise<{ server: Server; url: string; status: { code: number } }> {
  const status = { code: 200 };
  handler(status);
  const server = createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      res.writeHead(status.code, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ path: req.url, method: req.method, userId: req.headers['x-user-id'], body }));
    });
  });
  return new Promise((resolve) =>
    server.listen(0, () => resolve({ server, url: `http://127.0.0.1:${(server.address() as AddressInfo).port}`, status })),
  );
}

describe('API Gateway', () => {
  let upstream: Awaited<ReturnType<typeof startUpstream>>;
  let config: GatewayConfig;

  beforeEach(async () => {
    upstream = await startUpstream(() => undefined);
    config = {
      port: 0,
      jwtSecret: SECRET,
      publicUrl: 'http://localhost:3000',
      upstreamTimeoutMs: 2000,
      breakerResetMs: 60000,
      services: { iam: upstream.url, projectTask: upstream.url },
    };
  });

  afterEach(() => new Promise<void>((done) => upstream.server.close(() => done())));

  it('rejects protected routes without a token with 401 (QAS-05)', async () => {
    const res = await request(createApp(config).app).get('/api/v1/projects');
    expect(res.status).toBe(401);
    expect(res.body.detail).toBe('Missing bearer token.');
  });

  it('rejects tampered tokens with 401', async () => {
    const forged = jwt.sign({ sub: 'x', role: 'ADMIN' }, 'other-secret');
    const res = await request(createApp(config).app).get('/api/v1/projects').set('Authorization', `Bearer ${forged}`);
    expect(res.status).toBe(401);
  });

  it('lets public authentication routes through without a token', async () => {
    const res = await request(createApp(config).app).post('/api/v1/authentication/sign-in').send({ email: 'a@b.pe' });
    expect(res.status).toBe(200);
    expect(res.body.path).toBe('/api/v1/authentication/sign-in');
    expect(JSON.parse(res.body.body)).toEqual({ email: 'a@b.pe' });
  });

  it('forwards authenticated requests propagating the user identity', async () => {
    const res = await request(createApp(config).app).get('/api/v1/projects?page=2').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ path: '/api/v1/projects?page=2', method: 'GET', userId: 'user-1' });
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('opens the circuit after repeated upstream failures and answers 503 (QAS-02)', async () => {
    upstream.status.code = 500;
    const { app, proxies } = createApp(config);
    for (let i = 0; i < 3; i++) {
      const r = await request(app).get('/api/v1/projects').set('Authorization', `Bearer ${token}`);
      expect(r.status).toBe(500);
    }
    expect(proxies.projectTask.state).toBe('OPEN');
    const res = await request(app).get('/api/v1/projects').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(503);
    expect(res.body.type).toBe('circuit-open');
    // The IAM circuit is independent: a failing service does not take the others down.
    expect(proxies.iam.state).toBe('CLOSED');
    proxies.projectTask.breaker.shutdown();
    proxies.iam.breaker.shutdown();
  });

  it('answers 502 when the service cannot be reached', async () => {
    config.services.projectTask = 'http://127.0.0.1:1';
    const res = await request(createApp(config).app).get('/api/v1/tasks/abc').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(502);
  });

  it('answers 404 for unknown routes', async () => {
    const res = await request(createApp(config).app).get('/api/v1/unknown').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
