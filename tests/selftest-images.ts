import express from 'express';
import { registerRoutes } from '../server/routes';

async function main() {
  const app = express();
  app.use(express.json({ verify: (req: any, _res, buf) => { (req as any).rawBody = buf; } }));
  await registerRoutes(app as any, { version: 'selftest' });

  const server = app.listen(0);
  try {
    const addr: any = server.address();
    const base = `http://127.0.0.1:${addr.port}`;
    const res = await fetch(`${base}/api/selftest/images`);
    const json = await res.json();
    if (!res.ok || !json?.ok || !json?.bytes || !json?.contentType) {
      console.error('Selftest images FAILED:', { status: res.status, json });
      process.exit(1);
    }
    console.log('Selftest images OK:', json);
  } finally {
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
