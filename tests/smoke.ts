import express from 'express';
import jwt from 'jsonwebtoken';
import { registerRoutes } from '../server/routes';

async function main() {
  const app = express();
  app.use(express.json({
    verify: (req: any, _res, buf) => { (req as any).rawBody = buf; }
  }));

  // Register routes on the app (no need to listen on a port for supertest-like checks)
  await registerRoutes(app as any, { version: 'smoke' });

  // Minimal fetch-like helper using node's fetch
  async function req(method: string, path: string, body?: any, headers?: Record<string,string>) {
    const server = app.listen(0); // ephemeral port
    const address: any = server.address();
    const url = `http://127.0.0.1:${address.port}${path}`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(headers||{}) },
        body: body ? JSON.stringify(body) : undefined,
      } as any);
      const text = await res.text();
      let json: any = undefined;
      try { json = JSON.parse(text); } catch {}
      return { status: res.status, ok: res.ok, json, text };
    } finally {
      server.close();
    }
  }

  // 1) health
  const h = await req('GET', '/api/healthz');
  if (!h.ok || !h.json?.ok) {
    console.error('healthz FAILED:', h.status, h.text);
    process.exit(1);
  }
  console.log('healthz OK');

  // 2) login
  const login = await req('POST', '/api/auth/login', { username: 'admin', password: 'x' });
  if (!login.ok || !login.json?.token) {
    console.error('login FAILED:', login.status, login.text);
    process.exit(1);
  }
  const token = login.json.token as string;
  console.log('login OK');

  // 3) admin protected endpoint
  const admin = await req('GET', '/api/operator/transactions?limit=2', undefined, { Authorization: `Bearer ${token}` });
  if (!admin.ok || !Array.isArray(admin.json)) {
    console.error('admin tx FAILED:', admin.status, admin.text);
    process.exit(1);
  }
  console.log('admin tx OK');

  // 4) version
  const ver = await req('GET', '/api/version');
  if (!ver.ok || !ver.json?.version) {
    console.error('version FAILED:', ver.status, ver.text);
    process.exit(1);
  }
  console.log('version OK:', ver.json.version);

  console.log('All smoke tests PASSED');
}

main().catch((e)=>{ console.error(e); process.exit(1); });
