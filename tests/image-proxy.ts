import express from 'express';
import { registerRoutes } from '../server/routes';

async function main() {
  const app = express();
  app.use(express.json({
    verify: (req: any, _res, buf) => { (req as any).rawBody = buf; }
  }));

  await registerRoutes(app as any, { version: 'img-smoke' });

  // Start ephemeral server on random port
  const server = app.listen(0);
  const addr: any = server.address();
  const base = `http://127.0.0.1:${addr.port}`;

  try {
    const target = 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=400&q=60';
    const url = `${base}/api/proxy/img?u=${encodeURIComponent(target)}`;
    const res = await fetch(url);
    const ok = res.ok;
    const ct = res.headers.get('content-type') || '';
    const buf = Buffer.from(await res.arrayBuffer());

    if (!ok) {
      console.error('Image proxy smoke FAILED: status', res.status);
      process.exit(1);
    }
    if (!ct.startsWith('image/')) {
      console.error('Image proxy smoke FAILED: unexpected content-type', ct);
      process.exit(1);
    }
    if (buf.length < 5000) {
      console.error('Image proxy smoke FAILED: too few bytes', buf.length);
      process.exit(1);
    }

    console.log('Image proxy OK:', { status: res.status, contentType: ct, bytes: buf.length });
  } finally {
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
