import type { Request, Response, NextFunction } from 'express';
import { genRequestId, logger } from '../logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const reqId = (req.headers['x-request-id'] as string) || genRequestId();
  // @ts-ignore - attach to request for downstream usage
  req.reqId = reqId;
  const start = Date.now();
  const log = logger.child({ reqId, path: req.path, method: req.method });
  // @ts-ignore
  req.log = log;
  log.info('request.start', { ip: (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress });
  res.on('finish', () => {
    const dur = Date.now() - start;
    log.info('request.done', { status: res.statusCode, durMs: dur });
  });
  next();
}

export function errorLogger(err: any, req: Request, res: Response, _next: NextFunction) {
  // @ts-ignore
  const log = (req.log || logger);
  log.error('request.error', { err });
  if (res.headersSent) return;
  res.status(500).json({ error: 'internal_error' });
}
