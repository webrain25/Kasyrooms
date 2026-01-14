import express from 'express';
import type { Express } from 'express';
import supertest from 'supertest';
import crypto from 'crypto';
import { registerRoutes } from '../server/routes';

// Helper to build an app with our routes
async function buildApp(): Promise<{ app: Express; server: any; base: string }>{
  const app = express();
  // Capture raw body for webhook HMAC and parse JSON
  app.use(express.json({
    verify: (req: any, _res: any, buf: Buffer) => {
      req.rawBody = buf;
    }
  }));
  const server = await registerRoutes(app, { version: 'smoke' });
  return { app, server, base: '/' };
}

function basicHeader(user: string, pass: string): string {
  const b64 = Buffer.from(`${user}:${pass}`, 'utf8').toString('base64');
  return `Basic ${b64}`;
}

async function run() {
  // Ensure dev mode so Bearer verify falls back to format-only
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
  process.env.SIRPLAY_VERIFY_MODE = process.env.SIRPLAY_VERIFY_MODE || 'relaxed';
  // Set B2B creds for Basic-protected endpoints
  process.env.B2B_BASIC_AUTH_USER = process.env.B2B_BASIC_AUTH_USER || 'demo';
  process.env.B2B_BASIC_AUTH_PASS = process.env.B2B_BASIC_AUTH_PASS || 'demo';
  process.env.SIRPLAY_WEBHOOK_SECRET = process.env.SIRPLAY_WEBHOOK_SECRET || 'testsecret';
  // Minimal Sirplay env for wallet/login helpers
  process.env.SIRPLAY_BASE_URL = process.env.SIRPLAY_BASE_URL || 'https://sirplay.example.test';
  process.env.SIRPLAY_ACCESS_USER = process.env.SIRPLAY_ACCESS_USER || 'demo';
  process.env.SIRPLAY_ACCESS_PASS = process.env.SIRPLAY_ACCESS_PASS || 'demo';
  process.env.SIRPLAY_PARTNER_ID = process.env.SIRPLAY_PARTNER_ID || 'partner-001';
  process.env.SIRPLAY_PASSPORT = process.env.SIRPLAY_PASSPORT || 'passport-stub';

  const { app } = await buildApp();
  const agent: any = supertest(app);

  const demoBasic = basicHeader('demo', 'demo');

  // Seed via Sirplay handshake to obtain a Bearer token (relaxed mode)
  console.log('--- HANDSHAKE seed');
  const externalUserId = 'SIRPLAY-SMOKE-001';
  const seedRes = await agent
    .post('/api/sirplay/login')
    .send({ externalUserId, email: 'user@example.com', username: 'utente' });
  console.log('HANDSHAKE status:', seedRes.status, 'body:', seedRes.body);
  if (!(seedRes.status === 200 || seedRes.status === 201) || !seedRes.body?.token) {
    console.error('Handshake FAILED:', seedRes.status, seedRes.body);
    process.exit(1);
  }
  const handshakeToken = seedRes.body.token as string;

  console.log('--- REGISTER inbound');
  const regPayload = {
    eventId: 'evt-001',
    operation: 'REGISTER',
    action: 'USER_REGISTRATION',
    eventTime: Date.now(),
    userData: {
      userName: 'utente',
      userId: externalUserId,
      password: 'Secret123!',
      status: 'ACTIVE',
      email: 'user@example.com'
    }
  };
  const regRes = await agent
    .post('/user-account/signup/b2b/registrations')
    .set('Authorization', demoBasic)
    .send(regPayload);
  console.log('REGISTER status:', regRes.status, 'body:', regRes.body);

  // Strict-mode negative skipped: REGISTER is protected by Basic Auth
  console.log('--- REGISTER inbound strict negative (skipped: Basic Auth)');

  console.log('--- UPDATE inbound');
  const updPayload = {
    eventId: 'evt-002',
    operation: 'UPDATE',
    action: 'USER_CHANGE_MAIL',
    eventTime: Date.now(),
    userData: {
      externalId: externalUserId,
      email: 'user.updated@example.com',
      status: 'ACTIVE'
    }
  };
  const updRes = await agent
    .put('/user-account/signup/b2b/registrations')
    .set('Authorization', demoBasic)
    .send(updPayload);
  console.log('UPDATE status:', updRes.status, 'body:', updRes.body);

  console.log('--- GET USER INFO');
  const infoRes = await agent
    .get(`/api/user/getUserInfo?externalUserId=${encodeURIComponent(externalUserId)}`)
    .set('Authorization', demoBasic);
  console.log('INFO status:', infoRes.status, 'body:', infoRes.body);
  if (infoRes.status !== 200) {
    console.error('getUserInfo FAILED');
    process.exit(1);
  }

  console.log('--- LOGIN TOKENS');
  const tokRes = await agent
    .post('/api/b2b/login-tokens')
    .set('Authorization', demoBasic)
    .send({ externalId: infoRes.body.user.id });
  console.log('TOKENS status:', tokRes.status, 'body keys:', Object.keys(tokRes.body));

  console.log('--- WEBHOOK correct signature');
  const webhookBody = {
    transactionId: 'tx-001',
    externalUserId,
    email: 'user.updated@example.com',
    type: 'deposit',
    amount: 10.5,
    currency: 'EUR'
  };
  const raw = Buffer.from(JSON.stringify(webhookBody));
  const sigHex = crypto.createHmac('sha256', process.env.SIRPLAY_WEBHOOK_SECRET!).update(raw).digest('hex');
  const hookOk = await agent
    .post('/api/webhooks/sirplay')
    .set('x-sirplay-signature', `sha256=${sigHex}`)
    .set('x-sirplay-timestamp', Date.now().toString())
    .send(webhookBody);
  console.log('WEBHOOK ok status:', hookOk.status, 'body:', hookOk.body);

  console.log('--- WEBHOOK wrong signature');
  const hookBad = await agent
    .post('/api/webhooks/sirplay')
    .set('x-sirplay-signature', 'sha256=deadbeef')
    .set('x-sirplay-timestamp', Date.now().toString())
    .send(webhookBody);
  console.log('WEBHOOK bad status:', hookBad.status, 'body:', hookBad.body);

  console.log('--- WALLET OUT simulate idempotency');
  // Monkey-patch global fetch to simulate Sirplay responses
  const originalFetch = (globalThis as any).fetch;
  (globalThis as any).fetch = async (url: string, init: any) => {
    // For deposit/withdrawal endpoints, respond success once, then duplicate error
    const body = init?.body ? JSON.parse(init.body) : {};
    const idTx = body?.idTransaction || body?.externalReference;
    const key = `${url}::${idTx}`;
    (globalThis as any).__seen = (globalThis as any).__seen || new Set<string>();
    const seen: Set<string> = (globalThis as any).__seen;
    // Simulate login call returning a token
    if (String(url).includes('/user-account/signup/players/all/logins')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({ token: 'stub-token' }),
        text: async () => JSON.stringify({ token: 'stub-token' })
      } as any;
    }
    // Simulate wallet GET returning a balance
    if (String(url).includes('/wallet/b2b/users/') && String(url).endsWith('/wallets')) {
      return { ok: true, status: 200, json: async () => ({ balance: { walletDeposit: 100, walletBonus: 0 } }) } as any;
    }
    if (seen.has(key)) {
      return {
        ok: false,
        status: 409,
        json: async () => ({ error: 'idTransaction already exists' }),
        text: async () => JSON.stringify({ error: 'idTransaction already exists' })
      } as any;
    }
    seen.add(key);
    return { ok: true, status: 200, json: async () => ({ ok: true }), text: async () => JSON.stringify({ ok: true }) } as any;
  };

  // Use admin dev headers
  const dep1 = await agent
    .post('/api/sirplay/out/wallet/deposit')
    .set('x-user-id', 'a-001').set('x-role', 'admin')
    .send({ sirplayUserId: externalUserId, idTransaction: 'dup-001', amount: 5.00, currency: 'EUR' });
  const dep2 = await agent
    .post('/api/sirplay/out/wallet/deposit')
    .set('x-user-id', 'a-001').set('x-role', 'admin')
    .send({ sirplayUserId: externalUserId, idTransaction: 'dup-001', amount: 5.00, currency: 'EUR' });
  console.log('DEPOSIT statuses:', dep1.status, dep1.body, dep2.status, dep2.body);

  const w1 = await agent
    .post('/api/sirplay/out/wallet/withdrawal')
    .set('x-user-id', 'a-001').set('x-role', 'admin')
    .send({ sirplayUserId: externalUserId, idTransaction: 'dup-002', amount: 3.00, currency: 'EUR' });
  const w2 = await agent
    .post('/api/sirplay/out/wallet/withdrawal')
    .set('x-user-id', 'a-001').set('x-role', 'admin')
    .send({ sirplayUserId: externalUserId, idTransaction: 'dup-002', amount: 3.00, currency: 'EUR' });
  console.log('WITHDRAWAL statuses:', w1.status, w1.body, w2.status, w2.body);

  // Restore fetch
  (globalThis as any).fetch = originalFetch;
}

run().catch((e) => { console.error(e); process.exit(1); });
