import rateLimit from 'express-rate-limit';

const baseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['cf-connecting-ip'] || req.ip
});

export default function limiterMiddleware(req, res, next) {
  const p = req.path || '';
  const isBypass =
    req.method === 'GET' &&
    (p === '/' ||
     p === '/favicon.ico' ||
     p.startsWith('/assets') ||
     p.startsWith('/static') ||
     p.startsWith('/public'));
  if (isBypass) return next();
  if (p.startsWith('/api')) return baseLimiter(req, res, next);
  return next();
}
