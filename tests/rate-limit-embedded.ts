import express from 'express';
import rateLimit from 'express-rate-limit';
import limiterMiddleware from '../server/middleware/limiter.js';
import { registerRoutes } from '../server/routes';

async function main() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ verify: (req: any, _res, buf) => { (req as any).rawBody = buf; } }));
  // Attach library limiter directly for sanity, then project limiter
  app.use(rateLimit({ windowMs: 60_000, max: Number.parseInt(process.env.RATE_LIMIT_API_MAX || '3', 10) }));
  app.use(limiterMiddleware as any);

  await registerRoutes(app as any, { version: 'rate-smoke' });

  const server = app.listen(0);
  const addr: any = server.address();
  const base = `http://127.0.0.1:${addr.port}`;

  try {
    const res1 = await fetch(`${base}/api/version`);
    console.log('First status', res1.status);
    let limited = false;
    for (let i = 0; i < 10; i++) {
      const r = await fetch(`${base}/api/version`);
      console.log('Burst', i, r.status, r.headers.get('ratelimit'));
      if (r.status === 429) { limited = true; break; }
    }

    if (!limited) {
      console.error('Expected 429 after burst, but not limited');
      process.exit(1);
    }

    console.log('Rate limit embedded OK');
  } finally {
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
