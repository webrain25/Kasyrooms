import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

// Cloudflare-first, IPv6-safe client IP key
function getClientIpKey(req) {
  const cf = req.headers['cf-connecting-ip'];
  if (typeof cf === 'string' && cf.trim()) return cf.trim();

  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string' && xff.trim()) {
    const first = xff.split(',')[0].trim();
    if (first) return first;
  }
  // Fallback to library helper (trust proxy must be set on app)
  return ipKeyGenerator(req);
}

// Base API limiter (read-heavy endpoints will be exempted below)
const baseLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Allow override via env if we need to raise limits quickly without redeploy
  max: Number.parseInt(process.env.RATE_LIMIT_API_MAX || '300', 10),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIpKey(req),
  skip: (req) => req.path === '/health'
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

  // High-traffic media and RTC config should not be throttled by the base limiter
  const isMediaOrRtcBypass = req.method === 'GET' && (
    p === '/api/proxy/img' ||
    p.startsWith('/api/proxy/img') ||
    p === '/api/rtc/config'
  );
  if (isMediaOrRtcBypass) return next();

  // Optional global disable of base API limiter
  if (process.env.RATE_LIMIT_DISABLE === '1') return next();

  if (p.startsWith('/api')) return baseLimiter(req, res, next);
  return next();
}
