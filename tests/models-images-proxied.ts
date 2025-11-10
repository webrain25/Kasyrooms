import express from 'express';
import { registerRoutes } from '../server/routes';

async function main() {
  process.env.FORCE_PROXY_IMAGES = '1';
  const app = express();
  app.use(express.json({ verify: (req: any, _res, buf) => { (req as any).rawBody = buf; } }));
  await registerRoutes(app as any, { version: 'test' });

  const server = app.listen(0);
  try {
    const addr: any = server.address();
    const base = `http://127.0.0.1:${addr.port}`;
    const res = await fetch(`${base}/api/models`);
    const list = await res.json();
    if (!Array.isArray(list) || list.length === 0) {
      console.error('No models list');
      process.exit(1);
    }
    const bad = list.find((m: any) => typeof m?.profileImage === 'string' && m.profileImage.startsWith('http'));
    if (bad) {
      console.error('Found non-proxied profileImage:', bad.profileImage);
      process.exit(1);
    }
    const ok = list.every((m: any) => typeof m?.profileImage === 'string' && m.profileImage.startsWith('/api/proxy/img?u='));
    if (!ok) {
      console.error('Not all images proxied');
      process.exit(1);
    }
    console.log('Models images proxied OK');
  } finally {
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
