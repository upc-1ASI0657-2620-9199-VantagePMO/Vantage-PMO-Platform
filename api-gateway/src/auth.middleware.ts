import { NextFunction, Request, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { resolveRoute } from './routes';
import { sendProblem } from './problem';

/**
 * Centralized authentication (Security tactic, QAS-05): every non-public request must carry a
 * JWT signed by the IAM Service. Invalid requests are rejected here, before reaching any service.
 */
export function authMiddleware(jwtSecret: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const route = resolveRoute(req.path);
    if (!route || route.isPublic) return next();

    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      console.warn(`[gateway] 401 missing token ${req.method} ${req.originalUrl} from ${req.ip}`);
      return sendProblem(res, 401, 'Unauthorized', 'Missing bearer token.');
    }
    try {
      const payload = jwt.verify(header.substring(7), jwtSecret) as jwt.JwtPayload;
      req.headers['x-user-id'] = String(payload.sub);
      req.headers['x-user-role'] = String(payload.role);
      next();
    } catch {
      console.warn(`[gateway] 401 invalid token ${req.method} ${req.originalUrl} from ${req.ip}`);
      sendProblem(res, 401, 'Unauthorized', 'Invalid or expired token.');
    }
  };
}
