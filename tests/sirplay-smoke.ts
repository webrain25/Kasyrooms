import express from 'express';
import { registerRoutes } from '../server/routes';

async function main() {
  const app = express();
  app.use(express.json({ verify: (req: any, _res, buf) => { (req as any).rawBody = buf; } }));
  await registerRoutes(app as any, { version: 'sirplay-smoke' });

  // Helper to spin up an ephemeral listener for each request (isolated like supertest)
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
        headers: { 'Content-Type': 'application/json', 'Authorization': basicAuth, ...(headers||{}) },
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

  const extId = `sirplaySmoke_${Date.now()}`;
  const email = `${extId}@example.com`;

  // 1) Register external user
  const reg = await req('POST', '/api/user/register', { externalUserId: extId, email, name: 'Smoke Sirplay' });
  if (!reg.ok || !reg.json?.userId) {
    console.error('register FAILED:', reg.status, reg.text);
    process.exit(1);
  }
  const userId_B = reg.json.userId as string;
  console.log('register OK', { userId_B, externalUserId: extId });

  // 2) Balance shared (A) should be 0
  const bal0 = await req('GET', `/api/wallet/balance?userId_A=${encodeURIComponent(extId)}`);
  if (!bal0.ok || typeof bal0.json?.balance !== 'number') {
    console.error('balance(A) FAILED:', bal0.status, bal0.text);
    process.exit(1);
  }
  console.log('balance(A) OK', bal0.json);

  // 3) Deposit 12 on shared wallet (A)
  const txIdDep = `smk_${Date.now()}_dep`;
  const dep = await req('POST', '/api/wallet/deposit', { userId_A: extId, amount: 12, source: 'sirplay-smoke', transactionId: txIdDep });
  if (!dep.ok || dep.json?.newBalance !== bal0.json.balance + 12) {
    console.error('deposit(A) FAILED:', dep.status, dep.text);
    process.exit(1);
  }
  console.log('deposit(A) OK', dep.json);

  // 4) Withdrawal 5 on shared wallet (A)
  const txIdW = `smk_${Date.now()}_wd`;
  const wd = await req('POST', '/api/wallet/withdrawal', { userId_A: extId, amount: 5, source: 'sirplay-smoke', transactionId: txIdW });
  if (!wd.ok || wd.json?.newBalance !== dep.json.newBalance - 5) {
    console.error('withdrawal(A) FAILED:', wd.status, wd.text);
    process.exit(1);
  }
  console.log('withdrawal(A) OK', wd.json);

  // 5) Balance via local userId should resolve to shared mode (because of externalUserId)
  const balSharedViaB = await req('GET', `/api/wallet/balance?userId=${encodeURIComponent(userId_B)}`);
  if (!balSharedViaB.ok || balSharedViaB.json?.mode !== 'shared') {
    console.error('balance(B->shared) FAILED:', balSharedViaB.status, balSharedViaB.text);
    process.exit(1);
  }
  console.log('balance(B->shared) OK', balSharedViaB.json);

  // 6) SSO token for userId_B and validate
  const sso = await req('POST', '/api/sso/token', { userId_B });
  if (!sso.ok || !sso.json?.token) {
    console.error('sso token FAILED:', sso.status, sso.text);
    process.exit(1);
  }
  const token = sso.json.token as string;
  const val = await req('GET', `/api/sso/validate?token=${encodeURIComponent(token)}`);
  if (!val.ok || val.json?.valid !== true || val.json?.uid !== userId_B) {
    console.error('sso validate FAILED:', val.status, val.text);
    process.exit(1);
  }
  console.log('sso validate OK');

  console.log('Sirplay smoke tests PASSED');
}

main().catch((e)=>{ console.error(e); process.exit(1); });
