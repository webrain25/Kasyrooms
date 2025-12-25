import express from 'express';
import { registerRoutes } from '../server/routes';

async function main() {
  const app = express();
  app.use(express.json({
    verify: (req: any, _res, buf) => { (req as any).rawBody = buf; }
  }));

  await registerRoutes(app as any, { version: 'img-nested' });

  const server = app.listen(0);
  const addr: any = server.address();
  const base = `http://127.0.0.1:${addr.port}`;

  try {
    const target = 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=400&q=60';

    // Case 1: absolute nested proxy URL
    const innerAbs = `${base}/api/proxy/img?u=${encodeURIComponent(target)}`;
    const outerAbs = `${base}/api/proxy/img?u=${encodeURIComponent(innerAbs)}`;
    const resAbs = await fetch(outerAbs);

    if (!resAbs.ok) {
      console.error('Nested proxy (absolute) FAILED: status', resAbs.status);
      process.exit(1);
    }
    const ctAbs = resAbs.headers.get('content-type') || '';
    const bufAbs = Buffer.from(await resAbs.arrayBuffer());
    if (!ctAbs.startsWith('image/')) {
      console.error('Nested proxy (absolute) FAILED: unexpected content-type', ctAbs);
      process.exit(1);
    }
    if (bufAbs.length < 5000) {
      console.error('Nested proxy (absolute) FAILED: too few bytes', bufAbs.length);
      process.exit(1);
    }

    // Case 2: relative nested proxy URL
    const innerRel = `/api/proxy/img?u=${encodeURIComponent(target)}`;
    const outerRel = `${base}/api/proxy/img?u=${encodeURIComponent(innerRel)}`;
    const resRel = await fetch(outerRel);

    if (!resRel.ok) {
      console.error('Nested proxy (relative) FAILED: status', resRel.status);
      process.exit(1);
    }
    const ctRel = resRel.headers.get('content-type') || '';
    const bufRel = Buffer.from(await resRel.arrayBuffer());
    if (!ctRel.startsWith('image/')) {
      console.error('Nested proxy (relative) FAILED: unexpected content-type', ctRel);
      process.exit(1);
    }
    if (bufRel.length < 5000) {
      console.error('Nested proxy (relative) FAILED: too few bytes', bufRel.length);
      process.exit(1);
    }

    console.log('Nested image proxy OK:', {
      absolute: { status: resAbs.status, contentType: ctAbs, bytes: bufAbs.length },
      relative: { status: resRel.status, contentType: ctRel, bytes: bufRel.length },
    });
  } finally {
    server.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
