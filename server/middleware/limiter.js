import rateLimit from 'express-rate-limit';

// Base API limiter (read-heavy endpoints will be exempted below)
const baseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Allow override via env if we need to raise limits quickly without redeploy
  max: Number.parseInt(process.env.RATE_LIMIT_API_MAX || '600', 10),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (req) => req.headers['cf-connecting-ip'] || req.ip
});

export default function limiterMiddleware(req, res, next) {
  const p = req.path || '';
  // Static & root bypass
  const isStaticBypass =
    req.method === 'GET' &&
    (p === '/' ||
     p === '/favicon.ico' ||
     p.startsWith('/assets') ||
     p.startsWith('/static') ||
     p.startsWith('/public'));
  if (isStaticBypass) return next();

  // Public, frequently-polled endpoints exemptions (models list & online count)
  const isPublicPoll = req.method === 'GET' && (
    p === '/api/models' ||
    p.startsWith('/api/models?') ||
    p.startsWith('/api/models/') || // individual model fetches
    p === '/api/home/models' ||
    p === '/api/models-home' ||
    p === '/api/stats/online-count'
  );
  if (isPublicPoll) return next();

  // Optional global disable of base API limiter
  if (process.env.RATE_LIMIT_DISABLE === '1') return next();

  if (p.startsWith('/api')) return baseLimiter(req, res, next);
  return next();
}
