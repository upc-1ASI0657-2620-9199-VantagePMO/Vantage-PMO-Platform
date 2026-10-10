import { Response } from 'express';

/** Writes an RFC 7807 Problem Details response, the same error contract used by every microservice. */
export function sendProblem(res: Response, status: number, title: string, detail: string, type = 'about:blank'): void {
  res.status(status).type('application/problem+json').json({ type, title, status, detail, instance: res.req.originalUrl });
}
