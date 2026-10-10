import CircuitBreaker from 'opossum';
import { Request, Response } from 'express';
import { sendProblem } from './problem';

interface UpstreamResult {
  status: number;
  headers: Record<string, string>;
  body: Buffer;
}

class UpstreamServerError extends Error {
  constructor(public readonly result: UpstreamResult) {
    super(`Upstream answered ${result.status}`);
  }
}

const HOP_BY_HOP = new Set(['host', 'connection', 'content-length', 'transfer-encoding', 'keep-alive', 'upgrade']);

/**
 * Reverse proxy towards one microservice protected by a Circuit Breaker (Availability tactic, QAS-02).
 * When the service fails repeatedly the breaker opens and the gateway answers 503 immediately,
 * so the failure does not cascade; after `resetTimeout` it probes the service again (half-open).
 */
export class ServiceProxy {
  readonly breaker: CircuitBreaker<[Request], UpstreamResult>;

  constructor(
    public readonly name: string,
    private readonly baseUrl: string,
    options: { timeoutMs: number; resetMs: number },
  ) {
    this.breaker = new CircuitBreaker((req: Request) => this.forward(req), {
      timeout: options.timeoutMs,
      resetTimeout: options.resetMs,
      errorThresholdPercentage: 50,
      volumeThreshold: 3,
      rollingCountTimeout: 10000,
      name,
    });
    this.breaker.on('open', () => console.warn(`[gateway] circuit OPEN for ${name}`));
    this.breaker.on('halfOpen', () => console.warn(`[gateway] circuit HALF-OPEN for ${name}`));
    this.breaker.on('close', () => console.log(`[gateway] circuit CLOSED for ${name}`));
  }

  get state(): 'OPEN' | 'HALF_OPEN' | 'CLOSED' {
    return this.breaker.opened ? 'OPEN' : this.breaker.halfOpen ? 'HALF_OPEN' : 'CLOSED';
  }

  async handle(req: Request, res: Response): Promise<void> {
    try {
      this.write(res, await this.breaker.fire(req));
    } catch (error: any) {
      if (error instanceof UpstreamServerError) return this.write(res, error.result);
      if (error?.code === 'EOPENBREAKER') {
        return sendProblem(res, 503, 'Service Unavailable', `${this.name} is temporarily unavailable. Please retry in a few seconds.`, 'circuit-open');
      }
      if (error?.code === 'ETIMEDOUT') {
        return sendProblem(res, 504, 'Gateway Timeout', `${this.name} did not answer in time.`, 'upstream-timeout');
      }
      sendProblem(res, 502, 'Bad Gateway', `${this.name} could not be reached.`, 'upstream-unreachable');
    }
  }

  private async forward(req: Request): Promise<UpstreamResult> {
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined && !HOP_BY_HOP.has(key)) headers[key] = Array.isArray(value) ? value.join(', ') : value;
    }
    headers['x-forwarded-host'] = req.headers.host ?? '';
    const hasBody = !['GET', 'HEAD'].includes(req.method) && Buffer.isBuffer(req.body) && req.body.length > 0;
    const response = await fetch(`${this.baseUrl}${req.originalUrl}`, {
      method: req.method,
      headers,
      body: hasBody ? req.body : undefined,
    });
    const result: UpstreamResult = {
      status: response.status,
      headers: Object.fromEntries([...response.headers.entries()].filter(([k]) => !HOP_BY_HOP.has(k) && k !== 'content-encoding')),
      body: Buffer.from(await response.arrayBuffer()),
    };
    if (result.status >= 500) throw new UpstreamServerError(result);
    return result;
  }

  private write(res: Response, result: UpstreamResult): void {
    res.status(result.status);
    for (const [key, value] of Object.entries(result.headers)) res.setHeader(key, value);
    res.end(result.body);
  }
}
