import express from 'express';
import { registerRoutes } from '../server/routes';

async function main() {
  // Configure B2B Basic Auth for tests
  process.env.B2B_BASIC_AUTH_USER = process.env.B2B_BASIC_AUTH_USER || 'sirplay';
  process.env.B2B_BASIC_AUTH_PASS = process.env.B2B_BASIC_AUTH_PASS || 's3cr3t';
  const app = express();
  app.use(express.json({ verify: (req: any, _res, buf) => { (req as any).rawBody = buf; } }));
  await registerRoutes(app as any, { version: 'b2b-smoke' });

  const B2B_USER = process.env.B2B_BASIC_AUTH_USER || 'sirplay';
  const B2B_PASS = process.env.B2B_BASIC_AUTH_PASS || 's3cr3t';
  const basicAuth = 'Basic ' + Buffer.from(`${B2B_USER}:${B2B_PASS}`).toString('base64');

  async function req(method: string, path: string, body?: any, headers?: Record<string,string>) {
    const server = app.listen(0);
    const address: any = server.address();
    const url = `http://127.0.0.1:${address.port}${path}`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: basicAuth, ...(headers||{}) },
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

  async function reqNoAuth(method: string, path: string, body?: any) {
    const server = app.listen(0);
    const address: any = server.address();
    const url = `http://127.0.0.1:${address.port}${path}`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
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

  const extId = `sirplayB2B_${Date.now()}`;
  const email = `${extId}@example.local`;

  // Ensure mapping via Sirplay handshake (creates local user mapping)
  const seed = await req('POST', '/api/sirplay/login', { externalUserId: extId, email, username: 'b2b-test' }, {});
  if (!seed.ok || !seed.json?.token) {
    console.error('seed handshake FAILED:', seed.status, seed.text);
    process.exit(1);
  }
  const localId = seed.json?.user?.id;
  if (!localId) {
    console.error('seed handshake FAILED: missing local user id');
    process.exit(1);
  }

  const lt = await req('POST', '/api/b2b/login-tokens', { externalId: localId });
  if (!lt.ok || lt.json?.status !== 'success' || !lt.json?.loginToken || !lt.json?.accessLink) {
    console.error('login-tokens FAILED:', lt.status, lt.text);
    process.exit(1);
  }
  console.log('b2b login-tokens OK (new contract)');

  // Negative test: well-formed JSON without Authorization must not return 500; expect 401
  const ltNoAuth = await reqNoAuth('POST', '/api/b2b/login-tokens', { externalId: localId });
  if (ltNoAuth.status === 500) {
    console.error('login-tokens REGRESSION: got 500 without Authorization');
    process.exit(1);
  }
  if (ltNoAuth.status !== 401) {
    console.error('login-tokens NEGATIVE EXPECTATION FAILED: expected 401, got', ltNoAuth.status, ltNoAuth.text);
    process.exit(1);
  }
  console.log('b2b login-tokens no-auth returns 401 (no 500)');
}

main().catch((e)=>{ console.error(e); process.exit(1); });
