import express from 'express';
import jwt from 'jsonwebtoken';
import assert from 'assert';
import crypto from 'crypto';
import { registerRoutes } from '../server/routes';
import { db, schema } from '../server/db';
import { eq, and } from 'drizzle-orm';

async function main() {
  const app = express();
  app.use(express.json({
    verify: (req: any, _res, buf) => { (req as any).rawBody = buf; }
  }));

  await registerRoutes(app as any, { version: 'admin-rbac-test' });

  async function req(method: string, path: string, body?: any, headers?: Record<string, string>) {
    const server = app.listen(0);
    const address: any = server.address();
    const url = `http://127.0.0.1:${address.port}${path}`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...(headers || {}) },
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

  // 1) Without token, admin endpoints must return 401 (and not HTML).
  const meNoAuth = await req('GET', '/api/admin/auth/me');
  assert.equal(meNoAuth.status, 401);
  assert.equal(meNoAuth.json?.error, 'unauthorized');

  // 2) With a syntactically valid token, admin endpoints should never return 200
  // unless DB is configured and user exists. In DB-disabled setups it should be 503.
  const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev-secret';
  const fakeToken = jwt.sign({ uid: 'fake-user-id', role: 'user' }, secret, { expiresIn: '5m' });

  const meWithToken = await req('GET', '/api/admin/auth/me', undefined, { Authorization: `Bearer ${fakeToken}` });
  assert.ok([401, 403, 503].includes(meWithToken.status));
  if (meWithToken.status === 503) {
    assert.equal(meWithToken.json?.error, 'db_disabled');
  }

  const usersWithToken = await req('GET', '/api/admin/users?limit=1', undefined, { Authorization: `Bearer ${fakeToken}` });
  assert.ok([401, 403, 503].includes(usersWithToken.status));

  // 3) Login route exists and returns JSON errors.
  const login = await req('POST', '/api/admin/auth/login', { usernameOrEmail: 'nobody', password: 'bad' });
  assert.ok([400, 401, 403, 503].includes(login.status));
  assert.ok(login.json?.error);

  // 4) DB-enabled tests (optional): verify missing-permission details and audit/moderation logging.
  // These tests are skipped when DATABASE_URL is not configured.
  if (db) {
    const secret = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'dev-secret';

    const supportAdminId = `test-admin-support-${crypto.randomUUID()}`;
    const fullAdminId = `test-admin-full-${crypto.randomUUID()}`;
    const targetUserId = `test-user-target-${crypto.randomUUID()}`;

    const now = new Date();
    const cleanup = async () => {
      try {
        await db.delete(schema.auditLog).where(and(eq(schema.auditLog.actorAdminId as any, supportAdminId)));
      } catch {}
      try {
        await db.delete(schema.auditLog).where(and(eq(schema.auditLog.actorAdminId as any, fullAdminId)));
      } catch {}
      try {
        await db.delete(schema.moderationActions).where(and(eq(schema.moderationActions.adminId as any, fullAdminId)));
      } catch {}
      try {
        await db.delete(schema.moderationActions).where(and(eq(schema.moderationActions.adminId as any, supportAdminId)));
      } catch {}
      try {
        await db.delete(schema.users).where(eq(schema.users.id as any, targetUserId));
      } catch {}
      try {
        await db.delete(schema.users).where(eq(schema.users.id as any, supportAdminId));
      } catch {}
      try {
        await db.delete(schema.users).where(eq(schema.users.id as any, fullAdminId));
      } catch {}
    };

    try {
      // Create test principals.
      await db.insert(schema.users).values({
        id: supportAdminId,
        username: `support_${supportAdminId.slice(-8)}`,
        email: `support_${supportAdminId.slice(-8)}@example.test`,
        password: 'test',
        role: 'support',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      } as any);

      await db.insert(schema.users).values({
        id: fullAdminId,
        username: `admin_${fullAdminId.slice(-8)}`,
        email: `admin_${fullAdminId.slice(-8)}@example.test`,
        password: 'test',
        role: 'admin',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      } as any);

      await db.insert(schema.users).values({
        id: targetUserId,
        username: `user_${targetUserId.slice(-8)}`,
        email: `user_${targetUserId.slice(-8)}@example.test`,
        password: 'test',
        role: 'user',
        status: 'active',
        createdAt: now,
        updatedAt: now,
      } as any);

      // 4a) /api/admin/auth/me works for a valid admin token.
      const adminToken = jwt.sign({ uid: fullAdminId, kind: 'admin' }, secret, { expiresIn: '5m' });
      const meOk = await req('GET', '/api/admin/auth/me', undefined, { Authorization: `Bearer ${adminToken}` });
      assert.equal(meOk.status, 200);
      assert.equal(meOk.json?.admin?.id, fullAdminId);
      assert.ok(Array.isArray(meOk.json?.admin?.permissions));

      // 4b) Support is allowed into admin auth, but should be blocked by permission middleware.
      const supportToken = jwt.sign({ uid: supportAdminId, kind: 'admin' }, secret, { expiresIn: '5m' });
      const suspendForbidden = await req(
        'POST',
        `/api/admin/users/${encodeURIComponent(targetUserId)}/suspend`,
        { reason: 'test' },
        { Authorization: `Bearer ${supportToken}` },
      );
      assert.equal(suspendForbidden.status, 403);
      assert.equal(suspendForbidden.json?.error, 'forbidden');
      assert.equal(suspendForbidden.json?.missing, 'users.disable');

      // 4c) Full admin can perform action and it writes audit + moderation rows.
      const suspendOk = await req(
        'POST',
        `/api/admin/users/${encodeURIComponent(targetUserId)}/suspend`,
        { reason: 'test' },
        { Authorization: `Bearer ${adminToken}` },
      );
      assert.equal(suspendOk.status, 200);
      assert.equal(suspendOk.json?.status, 'ok');

      const aud = await db
        .select()
        .from(schema.auditLog)
        .where(and(eq(schema.auditLog.actorAdminId as any, fullAdminId), eq(schema.auditLog.targetId as any, targetUserId)))
        .limit(50);
      assert.ok(aud.length >= 1, 'expected at least one audit log row');

      const mods = await db
        .select()
        .from(schema.moderationActions)
        .where(and(eq(schema.moderationActions.adminId as any, fullAdminId), eq(schema.moderationActions.targetId as any, targetUserId)))
        .limit(50);
      assert.ok(mods.length >= 1, 'expected at least one moderation action row');
    } finally {
      await cleanup();
    }
  }

  console.log('Admin RBAC smoke: OK');
}

main().catch((e) => {
  console.error('Admin RBAC smoke: FAILED');
  console.error(e);
  process.exit(1);
});
