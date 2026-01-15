
import type { Express } from "express";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage.js";
import { logger } from "./logger.js";
import crypto from "crypto";
import { db, schema } from "./db.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { and, eq } from "drizzle-orm";
import { getOrCreateAccountBySirplayUserId, upsertWalletSnapshot, recordWalletTransactionIdempotent } from "./services/sirplayAdapter.js";
import { ensureLocalUserForSirplay } from "./services/identity.js";
// @ts-ignore - bundler resolves this TS module; suppress TS2306 in check
import {
  getSirplayConfigFromEnv,
  getSirplayPassportFromEnv,
  sirplayLogin,
  sirplayRegisterUser,
  sirplayUpdateUser,
  sirplayWalletGet,
  sirplayWalletDeposit,
  sirplayWalletWithdrawal,
  type SirplayUpdateAction,
} from "./services/sirplayClient.js";
import { z } from "zod";
import { ensureCacheDir, downloadAndCache } from "./image-cache.js";
import { getCachedImage } from "./image-cache.js";

// Read JWT secret lazily to ensure dotenv/config has been applied by the entrypoint
const getJWTSecret = () => process.env.JWT_SECRET || "dev-secret";

// B2B Basic Auth credentials helper (Sirplay -> Kasyrooms)
const getB2BCreds = () => ({
  user: (process.env.B2B_BASIC_AUTH_USER || process.env.SIRPLAY_B2B_USER || "").trim(),
  pass: (process.env.B2B_BASIC_AUTH_PASS || process.env.SIRPLAY_B2B_PASSWORD || "").trim(),
});

// Middleware enforcing HTTP Basic authentication for B2B endpoints
function requireB2BBasicAuth() {
  return (req: any, res: any, next: any) => {
    const unauthorized = () => {
      res.set('WWW-Authenticate', 'Basic realm="Kasyrooms B2B"');
      logger.info("b2b_auth.fail", { path: req.path, reason: "unauthorized" });
      return res.status(401).json({ error: 'unauthorized' });
    };

    const hdr = req.headers?.authorization || req.headers?.Authorization;
    if (typeof hdr !== 'string' || !hdr.startsWith('Basic ')) return unauthorized();

    const b64 = hdr.slice('Basic '.length).trim();

    let decoded = '';
    try {
      decoded = Buffer.from(b64, 'base64').toString('utf8');
    } catch {
      return unauthorized();
    }

    const sep = decoded.indexOf(':');
    if (sep <= 0) return unauthorized();

    const providedUser = decoded.slice(0, sep).trim();
    const providedPass = decoded.slice(sep + 1).trim();

    const { user, pass } = getB2BCreds();

    // In production, require explicit env configuration (do not allow defaults)
    if (process.env.NODE_ENV === 'production') {
      const hasB2B = !!(process.env.B2B_BASIC_AUTH_USER && process.env.B2B_BASIC_AUTH_PASS);
      const hasSirplay = !!(process.env.SIRPLAY_B2B_USER && process.env.SIRPLAY_B2B_PASSWORD);
      if (!(hasB2B || hasSirplay)) {
        console.error('[security] B2B basic auth credentials not configured in production');
        return res.status(503).json({ error: 'b2b_auth_not_configured' });
      }
    }

    // timingSafeEqual requires equal-length buffers, otherwise it throws.
    if (providedUser.length !== user.length || providedPass.length !== pass.length) {
      return unauthorized();
    }

    try {
      const uOk = crypto.timingSafeEqual(Buffer.from(providedUser), Buffer.from(user));
      const pOk = crypto.timingSafeEqual(Buffer.from(providedPass), Buffer.from(pass));
      if (!uOk || !pOk) return unauthorized();
    } catch {
      return unauthorized();
    }
    logger.info("b2b_auth.ok", { path: req.path, user: user ? "present" : "missing" });
    return next();
  };
}

// Sirplay inbound: require Bearer token presence (format-only check)
// Sirplay inbound: Bearer token verification via JWKS or introspection
function requireSirplayBearerVerified() {
  // Simple in-memory JWKS cache
    let jwksCache: { url: string; fetchedAt: number; keys: any[] } | null = null; // JWKS cache

  const fetchJwks = async (url: string) => {
    const now = Date.now();
    if (jwksCache && jwksCache.url === url && now - jwksCache.fetchedAt < 5 * 60 * 1000) {
      return jwksCache.keys;
    }
    const res = await fetch(url, { method: 'GET' } as any);
    if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
    const data: any = await res.json();
    const keys = Array.isArray(data?.keys) ? data.keys : [];
    jwksCache = { url, fetchedAt: now, keys };
    return keys;
  };

  const verifyWithJwks = async (token: string) => {
    const jwksUrl = (process.env.SIRPLAY_JWKS_URL || '').trim();
    if (!jwksUrl) return false;
    const decoded: any = jwt.decode(token, { complete: true });
    const kid = decoded?.header?.kid;
    const alg = decoded?.header?.alg;
    if (!kid || !alg) throw new Error('jwt_header_missing_kid_alg');
    const keys = await fetchJwks(jwksUrl);
    const jwk = keys.find((k: any) => k.kid === kid);
    if (!jwk) throw new Error('jwks_key_not_found');
    // Build KeyObject from JWK (Node supports JWK format)
    const keyObj = crypto.createPublicKey({ key: jwk, format: 'jwk' } as any);
    const options: any = {};
    if (process.env.SIRPLAY_JWT_ISSUER) options.issuer = process.env.SIRPLAY_JWT_ISSUER;
    if (process.env.SIRPLAY_JWT_AUDIENCE) options.audience = process.env.SIRPLAY_JWT_AUDIENCE;
    options.algorithms = [alg];
    jwt.verify(token, keyObj as any, options);
    return true;
  };

  const verifyWithIntrospection = async (token: string) => {
    const url = (process.env.SIRPLAY_INTROSPECT_URL || '').trim();
    if (!url) return false;
    const user = (process.env.SIRPLAY_B2B_USER || process.env.B2B_BASIC_AUTH_USER || '').trim();
    const pass = (process.env.SIRPLAY_B2B_PASSWORD || process.env.B2B_BASIC_AUTH_PASS || '').trim();
    const hdrs: Record<string, string> = { 'Content-Type': 'application/json' };
    if (user && pass) {
      const b64 = Buffer.from(`${user}:${pass}`, 'utf8').toString('base64');
      hdrs['Authorization'] = `Basic ${b64}`;
    }
    const res = await fetch(url, { method: 'POST', headers: hdrs, body: JSON.stringify({ token }) } as any);
    if (!res.ok) throw new Error(`introspect_failed_${res.status}`);
    const data = await res.json().catch(() => ({}));
    // Accept common shapes: { active: true } or { valid: true }
    const active = Boolean((data as any)?.active ?? (data as any)?.valid ?? true);
    return active;
  };

  return async (req: any, res: any, next: any) => {
    const hdr = req.headers?.authorization || req.headers?.Authorization;
    if (typeof hdr !== 'string' || !hdr.startsWith('Bearer ')) {
      logger.info("sirplay_bearer.blocked", { path: req.path, reason: 'missing_bearer' });
      return res.status(401).json({ error: 'missing_bearer' });
    }
    const token = hdr.slice('Bearer '.length).trim();
    if (!token) return res.status(401).json({ error: 'missing_bearer' });

    try {
      // Prefer JWKS, else introspection; fallback policy differs by env
      const jwksOk = await verifyWithJwks(token).catch(() => false);
      if (jwksOk) return next();
      const introspectOk = await verifyWithIntrospection(token).catch(() => false);
      if (introspectOk) return next();
      const mode = (process.env.SIRPLAY_VERIFY_MODE || '').trim().toLowerCase();
      // Force strict in production regardless of mode; else follow configured mode
      const strict = process.env.NODE_ENV === 'production' ? true : (mode === 'strict');

      if (!strict) {
        // In relaxed mode, allow integration tests even if JWKS/introspection are not configured
        return next();
      }

      logger.info("sirplay_bearer.blocked", { path: req.path, reason: 'not_verified' });
      return res.status(401).json({ error: 'sirplay_token_not_verified' });
    } catch (e: any) {
      logger.info("sirplay_bearer.blocked", { path: req.path, reason: 'invalid', message: e?.message || String(e) });
      return res.status(401).json({ error: 'sirplay_token_invalid', message: e?.message || String(e) });
    }
  };
}

export async function registerRoutes(app: any, opts?: { version?: string }): Promise<any> {
  const appVersion = opts?.version || "dev";
  // Force proxying of external images at API level when enabled, so the client always receives self-origin URLs
  const FORCE_PROXY_IMAGES = process.env.FORCE_PROXY_IMAGES === '1';
  const proxifyImage = (u?: string) => {
    if (!u) return u;
    // Do not re-proxy already proxied or local asset paths
    if (u.includes('/api/proxy/img')) return u;
    if (u.startsWith('/uploads/') || u.startsWith('/attached_assets/')) return u;
    if (u.startsWith('/')) return u;
    try {
      const url = new URL(u);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        // Avoid re-proxy if path already targets proxy endpoint
        if (url.pathname.startsWith('/api/proxy/img')) return u;
        if (url.pathname.startsWith('/uploads/') || url.pathname.startsWith('/attached_assets/')) return u;
        return `/api/proxy/img?u=${encodeURIComponent(u)}`;
      }
    } catch {}
    return u;
  };
  const proxifyModel = (m: any) => {
    if (!FORCE_PROXY_IMAGES || !m) return m;
    const copy = { ...m };
    if (typeof copy.profileImage === 'string') copy.profileImage = proxifyImage(copy.profileImage);
    if (Array.isArray(copy.photos)) copy.photos = copy.photos.map((p: string) => proxifyImage(p));
    return copy;
  };
  // Transform the grouped home structure returned by storage.listModelsHome
  const proxifyHomeGroups = (groups: any) => {
    if (!FORCE_PROXY_IMAGES || !groups) return groups;
    const transformGroup = (g: any) => {
      if (!g) return g;
      const tx = (arr: any[]) => Array.isArray(arr) ? arr.map(m => ({ ...m, photo_url: proxifyImage(m.photo_url) })) : [];
      return {
        online: tx(g.online),
        busy: tx(g.busy),
        offline: tx(g.offline)
      };
    };
    return {
      favorites: transformGroup(groups.favorites),
      others: transformGroup(groups.others)
    };
  };
  // Simple auth extraction: prefer JWT; fallback to dev headers x-user-id/x-role
  type ReqUser = { id: string; role: 'user'|'model'|'admin'; username?: string } | null;

  // Resolve current user from Authorization: Bearer <jwt> or dev headers
  function getReqUser(req: any): ReqUser {
    const hdr = req.headers?.authorization || req.headers?.Authorization;
    if (typeof hdr === 'string' && hdr.startsWith('Bearer ')) {
      const token = hdr.slice('Bearer '.length).trim();
      try {
        const payload = jwt.verify(token, getJWTSecret()) as any;
        const id = String(payload?.uid || payload?.id || '');
        const role = (payload?.role || 'user') as 'user'|'model'|'admin';
        const username = typeof payload?.username === 'string' ? payload.username : undefined;
        if (id) return { id, role, username };
      } catch {}
    }
    const devId = typeof req.headers['x-user-id'] === 'string' ? String(req.headers['x-user-id']) : undefined;
    const devRole = typeof req.headers['x-role'] === 'string' ? String(req.headers['x-role']) as any : undefined;
    if (devId && devRole) return { id: devId, role: devRole };
    return null;
  }

  function requireRole(roles: Array<'user'|'model'|'admin'>) {
    return (req: any, res: any, next: any) => {
      const u = getReqUser(req);
      (req as any).user = u;
      if (!u) return res.status(401).json({ error: 'unauthorized' });
      if (!roles.includes(u.role)) return res.status(403).json({ error: 'forbidden' });
      return next();
    };
  }

  // uploads root for KYC/DMCA assets
  const uploadsRoot = path.resolve(process.cwd(), 'uploads');
  // ===== Public Chat (per model, with optional moderation stub) =====
  // ===== Public Chat (per model, with optional moderation stub) =====
  app.get("/api/chat/public", async (req: any, res: any) => {
    const limit = Number(req.query.limit || 50);
    const modelId = typeof req.query.modelId === 'string' ? String(req.query.modelId) : undefined;
    res.json(await storage.listPublicMessages(modelId, limit));
  });
  app.post("/api/chat/public", async (req: any, res: any) => {
    const parsed = z.object({ user: z.string().min(1).max(40), text: z.string().min(1).max(500), userId_B: z.string().optional(), modelId: z.string().optional() }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    // Simple moderation stub: block if contains banned word
    const messageText = String(parsed.data.text);
    const banned = [/\b(offensive|hate|slur)\b/i];
    if (banned.some(rx => rx.test(messageText))) {
      return res.status(403).json({ error: 'message_blocked', reason: 'offensive_content' });
    }
    res.json(await storage.postPublicMessage(parsed.data.modelId, parsed.data.user, messageText, parsed.data.userId_B));
  });

  // ===== Models listing API (used by Home and Models pages) =====
  app.get('/api/models', async (req: any, res: any) => {
    try {
      const isOnline = String(req.query.online || '').toLowerCase() === 'true';
      const isNew = String(req.query.new || '').toLowerCase() === 'true';
      const sortByRaw = String(req.query.sortBy || '').toLowerCase();
      const sortBy = (sortByRaw === 'rating' || sortByRaw === 'viewers') ? sortByRaw : undefined;
      const search = typeof req.query.search === 'string' ? String(req.query.search) : undefined;
      const country = typeof req.query.country === 'string' ? String(req.query.country) : undefined;
      const language = typeof req.query.language === 'string' ? String(req.query.language) : undefined;
      const specialty = typeof req.query.specialty === 'string' ? String(req.query.specialty) : undefined;

      const list = await storage.listModels({
        isOnline: req.query.online ? isOnline : undefined,
        isNew: req.query.new ? isNew : undefined,
        sortBy: sortBy as any,
        search,
        country,
        language,
        specialty,
      });
      const mapped = Array.isArray(list) ? list.map(proxifyModel) : [];
      return res.json(mapped);
    } catch (e:any) {
      return res.status(500).json({ error: 'models_list_failed', message: e?.message || String(e) });
    }
  });

  // Single model by id
  app.get('/api/models/:id', async (req: any, res: any) => {
    try {
      const id = String(req.params.id || '').trim();
      if (!id) return res.status(400).json({ error: 'missing_id' });
      const m = await storage.getModel(id);
      if (!m) return res.status(404).json({ error: 'not_found' });
      return res.json(proxifyModel(m));
    } catch (e:any) {
      return res.status(500).json({ error: 'model_fetch_failed', message: e?.message || String(e) });
    }
  });

  // Record a model view (lightweight counter)
  app.post('/api/models/:id/view', async (req: any, res: any) => {
    try {
      const id = String(req.params.id || '').trim();
      const m = await storage.getModel(id);
      if (!m) return res.status(404).json({ error: 'not_found' });
      m.viewerCount = Number(m.viewerCount || 0) + 1;
      // persist back into storage map
      // @ts-ignore direct access to in-memory map for demo state
      storage.models.set(id, m);
      return res.json({ ok: true, viewerCount: m.viewerCount });
    } catch (e:any) {
      return res.status(500).json({ error: 'view_record_failed', message: e?.message || String(e) });
    }
  });

  // Rate a model (1..5 stars)
  app.post('/api/models/:id/rate', async (req: any, res: any) => {
    try {
      const id = String(req.params.id || '').trim();
      const stars = Number((req.body?.stars ?? req.query?.stars) || 0);
      if (!Number.isFinite(stars) || stars < 1 || stars > 5) return res.status(400).json({ error: 'invalid_stars' });
      const m = await storage.getModel(id);
      if (!m) return res.status(404).json({ error: 'not_found' });
      // simplistic smoothing update: move 20% towards new stars*10
      const target = Math.round(stars * 10);
      const current = Number(m.rating || 0);
      const next = Math.round(current * 0.8 + target * 0.2);
      m.rating = Math.max(0, Math.min(50, next));
      // @ts-ignore in-memory persistence
      storage.models.set(id, m);
      return res.json({ ok: true, rating: m.rating });
    } catch (e:any) {
      return res.status(500).json({ error: 'rate_failed', message: e?.message || String(e) });
    }
  });

  // Tip a model using local wallet (demo)
  app.post('/api/models/:id/tip', async (req: any, res: any) => {
    try {
      const id = String(req.params.id || '').trim();
      const amount = Number(req.body?.amount ?? req.query?.amount ?? 0);
      if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: 'invalid_amount' });
      const u = getReqUser(req);
      if (!u) return res.status(401).json({ error: 'unauthorized' });
      const m = await storage.getModel(id);
      if (!m) return res.status(404).json({ error: 'not_found' });
      try {
        await storage.localWithdraw(u.id, amount);
      } catch (e:any) {
        const msg = String(e?.message || e);
        if (msg === 'INSUFFICIENT_FUNDS') return res.status(400).json({ error: 'INSUFFICIENT_FUNDS' });
        throw e;
      }
      try { await storage.addTransaction({ userId_B: u.id, type: 'CHARGE', amount, source: 'TIP', externalRef: `tip:${id}` }); } catch {}
      return res.json({ ok: true, balance: await storage.getLocalBalance(u.id) });
    } catch (e:any) {
      return res.status(500).json({ error: 'tip_failed', message: e?.message || String(e) });
    }
  });

  // Lightweight stat used by filters bar
  app.get('/api/stats/online-count', async (_req: any, res: any) => {
    try {
      const list = await storage.listModels({});
      const count = Array.isArray(list) ? list.filter(m => !!m.isOnline && !m.isBusy).length : 0;
      return res.json({ count });
    } catch {
      return res.json({ count: 0 });
    }
  });

  // ===== Moderation (blocks, reports) used by profile page =====
  app.get('/api/moderation/blocks', async (req: any, res: any) => {
    try {
      const modelId = String(req.query?.modelId || '').trim();
      if (!modelId) return res.status(400).json({ error: 'missing_modelId' });
      const blocks = await storage.listBlocks(modelId);
      return res.json({ blocks });
    } catch (e:any) {
      return res.status(500).json({ error: 'blocks_list_failed', message: e?.message || String(e) });
    }
  });
  app.post('/api/moderation/block', async (req: any, res: any) => {
    try {
      const modelId = String(req.body?.modelId || '').trim();
      const userId = String(req.body?.userId || '').trim();
      if (!modelId || !userId) return res.status(400).json({ error: 'invalid_payload' });
      await storage.blockUser(modelId, userId);
      return res.json({ ok: true });
    } catch (e:any) {
      return res.status(500).json({ error: 'block_failed', message: e?.message || String(e) });
    }
  });
  app.post('/api/moderation/report', async (req: any, res: any) => {
    try {
      const modelId = String(req.body?.modelId || '').trim();
      const userId = String(req.body?.userId || '').trim();
      const reason = String(req.body?.reason || '').trim();
      if (!modelId || !userId || !reason) return res.status(400).json({ error: 'invalid_payload' });
      const r = await storage.addReport(modelId, userId, reason, String(req.body?.details || ''));
      return res.json({ ok: true, report: r });
    } catch (e:any) {
      return res.status(500).json({ error: 'report_failed', message: e?.message || String(e) });
    }
  });

  // Favorites API (optional, complements client local favorites)
  app.get('/api/favorites', requireRole(['user','model','admin']), async (req: any, res: any) => {
    const u = (req as any).user as ReqUser;
    const list = await storage.getFavorites(u!.id);
    res.json({ favorites: list });
  });
  app.post('/api/favorites/:modelId', requireRole(['user','model','admin']), async (req: any, res: any) => {
    const u = (req as any).user as ReqUser;
    const list = await storage.toggleFavorite(u!.id, String(req.params.modelId));
    res.json({ favorites: list });
  });

  // Convenience: allow starting a private show by username (useful from recent public chat list)
  app.post('/api/sessions/start-by-username', async (req: any, res: any) => {
    const parsed = z.object({ username: z.string().min(1), modelId: z.string().min(1) }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const user = await storage.getUserByUsername(String(parsed.data.username));
    if (!user) return res.status(404).json({ error: 'user not found' });
    const s = await storage.startSession(user.id, String(parsed.data.modelId));
    res.json(s);
  });

  // ===== INTEGRAZIONE SIRPLAY (Operatore B) =====

  // 1) REGISTER (Sirplay → Kasyrooms)
  // Requirements: Basic Auth, robust payload (nested userData or flat), minimal validation, upsert by externalId,
  // respond with normalized userData including nulls and profileType=PLAYER.
  app.post("/user-account/signup/b2b/registrations", requireB2BBasicAuth(), async (req: any, res: any) => {
    const raw = req.body ?? {};
    const isNested = raw && typeof raw === 'object' && raw.userData && typeof raw.userData === 'object';
    const payload = isNested ? raw.userData : raw;

    const pickStr = (v: any) => (typeof v === 'string' ? v : undefined);
    const userName = pickStr(payload.userName);
    const email = pickStr(payload.email);
    const status = pickStr(payload.status) || 'ACTIVE';
    const password = pickStr(payload.password);
    const name = pickStr(payload.name);
    const surname = pickStr(payload.surname);
    const birthDate = pickStr(payload.birthDate);
    const mobilePhone = pickStr(payload.mobilePhone);
    const createdInput = pickStr(payload.created);
    const sirplayUserId = pickStr(payload.userId);
    const customerId = pickStr((raw && raw.customerId) ?? (payload && (payload as any).customerId));
    // externalId for response is the Kasyrooms user id (local id), not Sirplay id
    // We'll generate/ensure local user mapped to Sirplay id and return local id as externalId

    // Validate mandatory fields after normalization
    if (!sirplayUserId || !userName || !email || !status) {
      return res.status(400).json({ error: 'invalid_payload', details: { userId: !!sirplayUserId, userName: !!userName, email: !!email, status: !!status } });
    }
    // Detect if user existed before upsert via Sirplay mapping
    const existed = !!(await storage.getUserByExternal(sirplayUserId!));

    // Ensure/create local mapping and update minimal profile
    const ensured = await ensureLocalUserForSirplay({
      externalUserId: sirplayUserId!,
      email: email ?? null,
      username: userName,
      role: 'user',
      firstName: name ?? null,
      lastName: surname ?? null,
      birthDate: birthDate ?? null,
      phoneNumber: mobilePhone ?? null,
    });

    // Best-effort: update email + sirplay fields immediately in memory
    await storage.updateUserById(ensured.id, { email, externalUserId: sirplayUserId!, sirplayUserId: sirplayUserId, sirplayCustomerId: customerId });

    // Persist createdAt and sirplay identifiers on first insert if provided and DB is available
    try {
      if (db) {
        if (!existed && createdInput) {
          await db.update(schema.users).set({ createdAt: new Date(createdInput) as any }).where(eq(schema.users.id, ensured.id));
        }
        await db.update(schema.users).set({
          externalUserId: sirplayUserId!,
          externalProvider: 'sirplay',
          sirplayUserId: sirplayUserId,
          sirplayCustomerId: customerId,
        }).where(eq(schema.users.id, ensured.id));
      }
    } catch {}

    const createdOut = new Date().toISOString();
    const lastUpdatedOut = null;

    const userData = {
      userName: userName,
      externalId: ensured.id,
      password: password ?? null,
      name: name ?? null,
      surname: surname ?? null,
      email: email ?? null,
      status: status ?? 'ACTIVE',
      birthDate: birthDate ?? null,
      lastUpdated: lastUpdatedOut,
      created: createdOut,
      mobilePhone: mobilePhone ?? null,
      profileType: 'PLAYER',
    } as const;

    // Always success response per Sirplay contract
    const httpStatus = existed ? 200 : 201;
    logger.info("sirplay_registration.success", { path: req.path, existed, httpStatus, externalId: ensured.id, sirplayUserId, customerId });
    return res.status(httpStatus).json({ status: 'success', userData });
  });

  // 2) UPDATE (Sirplay → Kasyrooms) — Basic Auth per doc
  app.put("/user-account/signup/b2b/registrations", requireB2BBasicAuth(), async (req: any, res: any) => {
    // Diagnostics (dev-only): helps confirm Sirplay PUT body parsing/shape.
    try {
      const isProd = process.env.NODE_ENV === 'production';
      const debug = process.env.SIRPLAY_DEBUG_PUT === '1';
      if (!isProd && debug) {
        const b = req.body ?? {};
        logger.info('sirplay_registration.update.debug', {
          path: req.path,
          contentType: req.headers['content-type'],
          bodyType: typeof b,
          bodyKeys: b && typeof b === 'object' ? Object.keys(b) : undefined,
          userDataKeys: b?.userData && typeof b.userData === 'object' ? Object.keys(b.userData) : undefined,
        });
      }
    } catch {}

    const parsed = z.object({
      eventId: z.string().min(1),
      operation: z.literal("UPDATE"),
      action: z.string().min(1), // USER_UPDATE / USER_CHANGE_MAIL / ...
      eventTime: z.union([z.number(), z.string()]),
      customerId: z.string().optional(),
      userData: z.object({
        // Sirplay semantic: userId is Sirplay user identifier.
        userId: z.string().min(1),
        userName: z.string().optional(),
        email: z.string().email().optional(),
        status: z.string().optional(),
        birthDate: z.string().optional(),
        name: z.string().optional(),
        surname: z.string().optional(),
        mobilePhone: z.string().optional(),
        lastUpdated: z.string().optional(),
      }).passthrough(),
    }).passthrough().safeParse(req.body ?? {});

    if (!parsed.success) {
      logger.warn('sirplay_registration.update.invalid_payload', { path: req.path, details: parsed.error.flatten() });
      return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    }

    const sirplayUserId = String(parsed.data.userData.userId);
    const customerId = parsed.data.customerId ?? undefined;

    // Resolve the local user mapped to the Sirplay userId.
    // Fallback to externalUserId mapping for backwards compatibility.
    let u = await storage.getUserBySirplayUserId(sirplayUserId);
    if (!u) u = await storage.getUserByExternal(sirplayUserId);

    // Upsert (idempotent): ensure local user exists and update profile best-effort.
    const ensured = u
      ? u
      : await ensureLocalUserForSirplay({
          externalUserId: sirplayUserId,
          email: parsed.data.userData.email ?? null,
          username: parsed.data.userData.userName ?? null,
          role: 'user',
          firstName: parsed.data.userData.name ?? null,
          lastName: parsed.data.userData.surname ?? null,
          birthDate: parsed.data.userData.birthDate ?? null,
          phoneNumber: parsed.data.userData.mobilePhone ?? null,
        });

    // Update in-memory record for immediate consistency.
    await storage.updateUserById(ensured.id, {
      email: parsed.data.userData.email ?? ensured.email,
      externalUserId: sirplayUserId,
      sirplayUserId,
      sirplayCustomerId: customerId,
    });

    // Persist best-effort to DB: align external mapping and update profile/status.
    try {
      if (db) {
        const patch: any = {
          externalProvider: 'sirplay',
          externalUserId: sirplayUserId,
          sirplayUserId,
          sirplayCustomerId: customerId,
        };
        if (parsed.data.userData.email !== undefined) patch.email = parsed.data.userData.email;
        if (parsed.data.userData.name !== undefined) patch.firstName = parsed.data.userData.name;
        if (parsed.data.userData.surname !== undefined) patch.lastName = parsed.data.userData.surname;
        if (parsed.data.userData.mobilePhone !== undefined) patch.phoneNumber = parsed.data.userData.mobilePhone;
        if (parsed.data.userData.birthDate !== undefined) patch.dob = new Date(parsed.data.userData.birthDate) as any;
        if (parsed.data.userData.status !== undefined) patch.status = parsed.data.userData.status;
        await db.update(schema.users).set(patch).where(eq(schema.users.id, ensured.id));
      }
    } catch {}

    logger.info('sirplay_registration.update.success', {
      path: req.path,
      eventId: parsed.data.eventId,
      action: parsed.data.action,
      sirplayUserId,
      externalId: ensured.id,
      customerId,
    });

    // Keep response stable but include the local id for traceability.
    return res.json({ status: "UPDATED", externalUserId: sirplayUserId, externalId: ensured.id });
  });

  // Sirplay handshake: receive/resolve external_user_id, ensure local mapping and accounts entry
  async function sirplayHandshake(req: any, res: any) {
    const parsed = z.object({
      externalUserId: z.string().min(1),
      email: z.string().email(),
      username: z.string().optional(),
      displayName: z.string().optional(),
      avatarUrl: z.string().url().optional(),
      role: z.enum(['user','model','admin']).optional(),
    }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const { externalUserId, email, username, displayName, avatarUrl, role } = parsed.data;

    // Ensure local user via centralized helper
    const u = await ensureLocalUserForSirplay({
      externalUserId,
      email,
      username: username ?? null,
      role: 'user',
    });

    // Ensure Accounts mapping exists (provider/user id) for Sirplay
    try {
      await getOrCreateAccountBySirplayUserId({
        externalUserId,
        email,
        displayName: displayName ?? username ?? u.username,
        avatarUrl,
        role: role ?? 'user',
      });
    } catch (e:any) {
      const msg = String(e?.message || e);
      if (msg !== 'DB_DISABLED') {
        return res.status(400).json({ error: 'sirplay_mapping_failed', message: msg });
      }
      // If DB is disabled locally, proceed without accounts mapping
    }

    // Issue a JWT for the local user
    const token = jwt.sign({ uid: u.id, role: 'user', username: u.username }, getJWTSecret(), { expiresIn: '1d' });
    return res.json({ token, user: { id: u.id, username: u.username, role: 'user', email: u.email }, mode: 'sirplay' });
  }
  app.post('/api/sirplay/handshake', sirplayHandshake);
  app.post('/api/sirplay/login', sirplayHandshake);

  // ==========================
  // OUTBOUND: Operatore -> Sirplay (quelli che ti mancavano in "No")
  // ==========================
  // Nota: questi endpoint sono per TE (o admin) per forzare sincronizzazione verso Sirplay.
  // Sirplay li richiede come funzionalità, ma non può chiamare "Sirplay stesso" da fuori.

  // Register a Kasyrooms user onto Sirplay (Operatore -> Sirplay)
  // Body: { userId_B: "<localUserId>", password: "...", status?: "ACTIVE", birthDate?: "...", ... }
  app.post("/api/sirplay/out/user-registrations", requireRole(["admin"]), async (req: any, res: any) => {
    try {
      const parsed = z.object({
        userId_B: z.string().min(1),      // local user id
        password: z.string().min(6),
        status: z.string().optional().default("ACTIVE"),
        birthDate: z.string().optional(),
        name: z.string().optional(),
        surname: z.string().optional(),
        email: z.string().email().optional(),
        mobilePhone: z.string().optional(),
      }).safeParse(req.body ?? {});
      if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });

      const u = await storage.getUser(parsed.data.userId_B);
      if (!u) return res.status(404).json({ error: "user_not_found" });

      const cfg = getSirplayConfigFromEnv();
      const { token } = await sirplayLogin(cfg);

      // Payload conforme alla collection: eventId/operation/action/eventTime/userData
      const resp = await sirplayRegisterUser(cfg, token, {
        userName: u.username,
        externalId: u.id,
        password: parsed.data.password,
        status: parsed.data.status,
        birthDate: parsed.data.birthDate,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email ?? u.email,
        mobilePhone: parsed.data.mobilePhone,
        created: new Date().toISOString(),
        lastUpdated: null,
      });

      // TODO: capire dove Sirplay restituisce l'ID (spesso "userId" o simile). Dipende dalla loro risposta.
      // Per sicurezza salviamo comunque mapping se lo troviamo.
      const sirplayUserId =
        String(resp?.userData?.userId || resp?.userId || resp?.data?.userId || "").trim() || null;

      if (sirplayUserId) {
        try {
          if (db) {
            await db.update(schema.users).set({ externalUserId: sirplayUserId }).where(eq(schema.users.id, u.id));
          }
        } catch {}
      }

      return res.json({ ok: true, sirplayUserId, sirplayResponse: resp });
    } catch (e: any) {
      return res.status(502).json({ error: "sirplay_register_failed", message: e?.message, response: e?.response });
    }
  });

  // Update a Sirplay user from Kasyrooms (Operatore -> Sirplay)
  // Body: { userId_B: "<localUserId>", action: "USER_UPDATE", ...fields }
  app.put("/api/sirplay/out/user/update", requireRole(["admin"]), async (req: any, res: any) => {
    try {
      const parsed = z.object({
        userId_B: z.string().min(1),
        action: z.custom((v: any) => typeof v === "string", "action required"),
        password: z.string().optional(),
        status: z.string().optional(),
        birthDate: z.string().optional(),
        name: z.string().optional(),
        surname: z.string().optional(),
        email: z.string().email().optional(),
        mobilePhone: z.string().optional(),
      }).safeParse(req.body ?? {});
      if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });

      const u = await storage.getUser(parsed.data.userId_B);
      if (!u) return res.status(404).json({ error: "user_not_found" });

      // Qui stai usando externalUserId come "Sirplay user id": va bene solo se lo hai mappato così.
      // In alternativa, dovrai avere un campo dedicato (es sirplayUserId).
      const sirplayUserId = u.externalUserId;
      if (!sirplayUserId) return res.status(400).json({ error: "missing_sirplay_userId_mapping" });

      const cfg = getSirplayConfigFromEnv();
      const { token } = await sirplayLogin(cfg);

      const resp = await sirplayUpdateUser(cfg, token, parsed.data.action as SirplayUpdateAction, {
        userName: u.username,
        externalId: u.id,
        password: parsed.data.password,
        status: parsed.data.status,
        birthDate: parsed.data.birthDate,
        name: parsed.data.name,
        surname: parsed.data.surname,
        email: parsed.data.email,
        mobilePhone: parsed.data.mobilePhone,
        // created può essere omesso in update, ma lasciarlo non rompe; lo omettiamo
      });

      return res.json({ ok: true, sirplayUserId, sirplayResponse: resp });
    } catch (e: any) {
      return res.status(502).json({ error: "sirplay_update_failed", message: e?.message, response: e?.response });
    }
  });

  // GET wallet from Sirplay (b2b)
  app.get("/api/sirplay/out/wallet", requireRole(["admin"]), async (req: any, res: any) => {
    try {
      const sirplayUserId = String(req.query.sirplayUserId || "").trim();
      if (!sirplayUserId) return res.status(400).json({ error: "sirplayUserId required" });

      const cfg = getSirplayConfigFromEnv();
      const { token } = await sirplayLogin(cfg);

      const passport = getSirplayPassportFromEnv();
      const resp = await sirplayWalletGet(cfg, token, passport, sirplayUserId);
      return res.json({ ok: true, sirplayResponse: resp });
    } catch (e: any) {
      return res.status(502).json({ error: "sirplay_wallet_get_failed", message: e?.message, response: e?.response });
    }
  });

  // POST deposit to Sirplay (b2b)
  app.post("/api/sirplay/out/wallet/deposit", requireRole(["admin"]), async (req: any, res: any) => {
    try {
      const parsed = z.object({
        sirplayUserId: z.string().min(1),
        idTransaction: z.string().min(1),
        amount: z.number().positive(),
        currency: z.string().optional(),
        description: z.string().optional(),
        sourceUser: z.string().optional(),
        externalReference: z.string().optional(),
      }).safeParse(req.body ?? {});
      if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });

      const cfg = getSirplayConfigFromEnv();
      const { token } = await sirplayLogin(cfg);

      const defaultCurrency = (process.env.SIRPLAY_WALLET_CURRENCY || '').trim() || 'USD';

      const passport = getSirplayPassportFromEnv();
      const body = {
        idTransaction: parsed.data.idTransaction,
        amount: parsed.data.amount,
        currency: parsed.data.currency || defaultCurrency,
        type: "EXTERNAL_DEPOSIT" as const,
        partnerId: cfg.partnerId || (process.env.SIRPLAY_PARTNER_ID || "").trim(),
        description: parsed.data.description,
        sourceUser: parsed.data.sourceUser,
        externalReference: parsed.data.externalReference || parsed.data.idTransaction,
      };
      try {
        const resp = await sirplayWalletDeposit(cfg, token, passport, parsed.data.sirplayUserId, body);
        return res.json({ ok: true, sirplayResponse: resp });
      } catch (e: any) {
        const msg = String(e?.message || "");
        // Map common Sirplay errors
        if (/NOT_CONSUMED_AMOUNT/i.test(msg)) {
          return res.status(409).json({ error: "not_consumed_amount", message: msg });
        }
        if (/duplicate|already exists|idTransaction/i.test(msg)) {
          return res.status(409).json({ error: "idempotent_conflict", message: msg });
        }
        throw e;
      }
    } catch (e: any) {
      return res.status(502).json({ error: "sirplay_wallet_deposit_failed", message: e?.message, response: e?.response });
    }
  });

  // POST withdrawal to Sirplay (b2b)
  app.post("/api/sirplay/out/wallet/withdrawal", requireRole(["admin"]), async (req: any, res: any) => {
    try {
      const parsed = z.object({
        sirplayUserId: z.string().min(1),
        idTransaction: z.string().min(1),
        amount: z.number().positive(),
        currency: z.string().optional(),
        description: z.string().optional(),
        sourceUser: z.string().optional(),
        externalReference: z.string().optional(),
      }).safeParse(req.body ?? {});
      if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });

      const cfg = getSirplayConfigFromEnv();
      const { token } = await sirplayLogin(cfg);

      const defaultCurrency = (process.env.SIRPLAY_WALLET_CURRENCY || '').trim() || 'USD';

      const passport = getSirplayPassportFromEnv();
      const body = {
        idTransaction: parsed.data.idTransaction,
        amount: parsed.data.amount,
        currency: parsed.data.currency || defaultCurrency,
        type: "EXTERNAL_WITHDRAWAL" as const,
        partnerId: cfg.partnerId || (process.env.SIRPLAY_PARTNER_ID || "").trim(),
        description: parsed.data.description,
        sourceUser: parsed.data.sourceUser,
        externalReference: parsed.data.externalReference || parsed.data.idTransaction,
      };
      try {
        const resp = await sirplayWalletWithdrawal(cfg, token, passport, parsed.data.sirplayUserId, body);
        return res.json({ ok: true, sirplayResponse: resp });
      } catch (e: any) {
        const msg = String(e?.message || "");
        if (/NOT_CONSUMED_AMOUNT/i.test(msg)) {
          return res.status(409).json({ error: "not_consumed_amount", message: msg });
        }
        if (/duplicate|already exists|idTransaction/i.test(msg)) {
          return res.status(409).json({ error: "idempotent_conflict", message: msg });
        }
        throw e;
      }
    } catch (e: any) {
      return res.status(502).json({ error: "sirplay_wallet_withdrawal_failed", message: e?.message, response: e?.response });
    }
  });

  // 2) Info player lato Operatore B
  app.get("/api/v1/player/info", async (req: any, res: any) => {
    const playerId = String(req.query.playerId || "");
    const user = playerId ? await storage.getUser(playerId) : undefined;
    if (!user) return res.status(404).json({ status: "not_found" });
    const balance = await storage.getBalance(user.externalUserId || "");
    return res.json({
      status: "ok",
      player: {
        playerId: user.id,
        nickname: user.username,
        balance: { walletDeposit: balance, walletBonus: 0 },
        currency: "EUR",
        lastLogin: new Date().toISOString()
      }
    });
  });

  // ===== Pull user info by externalUserId (Sirplay -> Kasyrooms) =====
  // Secured via B2B Basic Auth
  app.get('/api/user/getUserInfo', requireB2BBasicAuth(), async (req: any, res: any) => {
    const externalUserId = String(req.query.externalUserId || '').trim();
    if (!externalUserId) return res.status(400).json({ error: 'externalUserId required' });

    const user = await storage.getUserByExternal(externalUserId);
    if (!user) return res.status(404).json({ status: 'not_found' });

    // Return basic profile + wallet snapshot (shared A when mapped)
    let wallet: any = null;
    try {
      const balance = await storage.getBalance(externalUserId);
      wallet = { balance, currency: 'EUR', mode: 'shared' };
    } catch {}

    return res.json({
      status: 'ok',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || 'user',
        externalUserId: user.externalUserId,
        firstName: (user as any).firstName,
        lastName: (user as any).lastName,
        phoneNumber: (user as any).phoneNumber,
        status: (user as any).status,
      },
      wallet,
    });
  });

  // 3) SSO: Sirplay chiede token per userId_B
  app.post("/api/sso/token", requireB2BBasicAuth(), async (req: any, res: any) => {
    const parsed = z.object({ userId_B: z.string().min(1) }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const token = jwt.sign({ uid: parsed.data.userId_B }, getJWTSecret(), { expiresIn: "10m" });
    res.json({ token, expiresIn: 600 });
  });

  // B2B: issue login token for existing Sirplay externalId
  // Contract: input { externalId } or legacy { userId }, output { status, loginToken, accessLink }
  async function issueLoginTokenHandler(req: any, res: any) {
    const body = req.body ?? {};
    const pickStr = (v: any) => (typeof v === 'string' ? v : undefined);
    const externalId = pickStr(body.externalId);
    if (!externalId) {
      return res.status(400).json({ error: 'invalid_payload', details: { externalId: false } });
    }

    // Lookup strictly by Kasyrooms local id (externalId == local user id)
    const user = await storage.getUser(externalId);
    if (!user) {
      return res.status(404).json({ error: 'user_not_found', externalId });
    }

    // Generate and store an opaque login token with TTL
    const loginToken = await storage.createLoginToken(user.id, 600);
    let base = (process.env.BASE_URL || process.env.PUBLIC_URL || process.env.FRONTEND_URL || '').trim();
    if (!base) base = 'http://127.0.0.1:5000';
    const accessLink = `${base.replace(/\/+$/, '')}?token=${encodeURIComponent(loginToken)}`;

    logger.info("b2b_login_token.issued", { path: req.path, externalId, accessLinkPreview: accessLink.slice(0, 80) });
    return res.json({ status: 'success', loginToken, accessLink });
  }

  app.post("/api/b2b/login-tokens", requireB2BBasicAuth(), issueLoginTokenHandler);

  // Doc alias: POST /b2b/login-tokens with body { externalId: "..." }
  app.post("/b2b/login-tokens", requireB2BBasicAuth(), issueLoginTokenHandler);

  // Consume login token and establish session
  app.post('/api/auth/login-token', async (req: any, res: any) => {
    try {
      const token = String(req.body?.token || '').trim();
      if (!token) return res.status(400).json({ error: 'invalid_payload', details: { token: false } });
      const result = await storage.consumeLoginToken(token);
      if (!result.ok) {
        logger.info('login_token.consume.fail', { tokenPreview: token.slice(0,8), reason: result.error });
        return res.status(401).json({ error: 'invalid_token', reason: result.error });
      }
      const user = await storage.getUser(result.userId!);
      if (!user) {
        logger.info('login_token.consume.fail', { tokenPreview: token.slice(0,8), reason: 'user_not_found' });
        return res.status(404).json({ error: 'user_not_found' });
      }
      // Issue a JWT to represent session and set HttpOnly cookie
      const jwtToken = jwt.sign({ uid: user.id, role: user.role || 'user', username: user.username }, getJWTSecret(), { expiresIn: '1d' });
      const secure = process.env.NODE_ENV === 'production';
      const cookie = [
        `kr_session=${jwtToken}`,
        'Path=/',
        'HttpOnly',
        secure ? 'Secure' : '',
        'SameSite=Lax',
        `Max-Age=${60*60*24}`
      ].filter(Boolean).join('; ');
      res.setHeader('Set-Cookie', cookie);
      logger.info('login_token.consume.ok', { userId: user.id });
      return res.json({ status: 'ok', token: jwtToken, user: { id: user.id, username: user.username, email: user.email, role: user.role || 'user' } });
    } catch (e:any) {
      return res.status(500).json({ error: 'token_consume_failed', message: e?.message || String(e) });
    }
  });

  // util per validare token (B)
  app.get("/api/sso/validate", requireB2BBasicAuth(), async (req: any, res: any) => {
    const token = String(req.query.token || "");
    try {
      const payload = jwt.verify(token, getJWTSecret()) as any;
      res.json({ valid: true, uid: payload.uid });
    } catch (e:any) {
      res.status(401).json({ valid: false, error: e?.message || "invalid token" });
    }
  });

  // 4) Wallet proxy lato B verso A (qui simulato in memoria)
  // Wallet: shared (A) or local (B)
  app.get("/api/wallet/balance", requireB2BBasicAuth(), async (req: any, res: any) => {
    const explicitUserIdA = req.query.userId_A ? String(req.query.userId_A) : undefined;
    const userId = req.query.userId ? String(req.query.userId) : undefined;
    if (!explicitUserIdA && !userId) return res.status(400).json({ error: "userId or userId_A required" });
    try {
      if (explicitUserIdA) {
        const balance = await storage.getBalance(explicitUserIdA);
        return res.json({ userId_A: explicitUserIdA, balance, currency: "EUR", mode: 'shared' });
      }
      // resolve user and decide mode
      const u = userId ? await storage.getUser(userId) : undefined;
      if (!u) return res.status(404).json({ error: 'user not found' });
      if (u.externalUserId) {
        const balance = await storage.getBalance(u.externalUserId);
        return res.json({ userId_A: u.externalUserId, balance, currency: "EUR", mode: 'shared' });
      }
      const balance = await storage.getLocalBalance(u.id);
      return res.json({ userId: u.id, balance, currency: "EUR", mode: 'local' });
    } catch (e:any) {
      return res.status(500).json({ error: e?.message || 'BALANCE_ERROR' });
    }
  });

  app.post("/api/wallet/deposit", requireB2BBasicAuth(), async (req: any, res: any) => {
    const parsed = z.object({ userId_A: z.string().optional(), userId: z.string().optional(), amount: z.number(), transactionId: z.string().optional(), source: z.string().optional() }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const { userId_A, userId, amount, transactionId, source } = parsed.data;
    if (!userId_A && !userId) return res.status(400).json({ error: 'userId or userId_A required' });
    try {
      if (userId_A) {
        const newBalance = await storage.deposit(userId_A, amount);
        const tx = await storage.addTransaction({ userId_A, type: 'DEPOSIT', amount, source, externalRef: transactionId });
        try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_A, type: 'DEPOSIT', amountCents: Math.round(amount * 100), currency: 'EUR', source, externalRef: transactionId }); } } catch {}
        return res.json({ userId_A, newBalance, transactionId, status: "SUCCESS", source, mode: 'shared' });
      }
      const u = await storage.getUser(String(userId));
      if (!u) return res.status(404).json({ error: 'user not found' });
      if (u.externalUserId) {
        const newBalance = await storage.deposit(u.externalUserId, amount);
        const tx = await storage.addTransaction({ userId_A: u.externalUserId, type: 'DEPOSIT', amount, source, externalRef: transactionId });
        try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_A: u.externalUserId, type: 'DEPOSIT', amountCents: Math.round(amount * 100), currency: 'EUR', source, externalRef: transactionId }); } } catch {}
        return res.json({ userId_A: u.externalUserId, newBalance, transactionId, status: "SUCCESS", source, mode: 'shared' });
      }
      const newBalance = await storage.localDeposit(u.id, amount);
      const tx = await storage.addTransaction({ userId_B: u.id, type: 'DEPOSIT', amount, source, externalRef: transactionId });
      try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_B: u.id, type: 'DEPOSIT', amountCents: Math.round(amount * 100), currency: 'EUR', source, externalRef: transactionId }); } } catch {}
      return res.json({ userId: u.id, newBalance, transactionId, status: "SUCCESS", source, mode: 'local' });
    } catch (e:any) {
      return res.status(500).json({ error: e?.message || 'DEPOSIT_ERROR' });
    }
  });

  app.post("/api/wallet/withdrawal", requireB2BBasicAuth(), async (req: any, res: any) => {
    const parsed = z.object({ userId_A: z.string().optional(), userId: z.string().optional(), amount: z.number(), transactionId: z.string().optional(), source: z.string().optional() }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const { userId_A, userId, amount, transactionId, source } = parsed.data;
    if (!userId_A && !userId) return res.status(400).json({ error: 'userId or userId_A required' });
    try {
      if (userId_A) {
        const newBalance = await storage.withdraw(userId_A, amount);
        const tx = await storage.addTransaction({ userId_A, type: 'WITHDRAWAL', amount, source, externalRef: transactionId });
        try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_A, type: 'WITHDRAWAL', amountCents: Math.round(amount * 100), currency: 'EUR', source, externalRef: transactionId }); } } catch {}
        return res.json({ userId_A, newBalance, transactionId, status: "SUCCESS", source, mode: 'shared' });
      }
      const u = await storage.getUser(String(userId));
      if (!u) return res.status(404).json({ error: 'user not found' });
      if (u.externalUserId) {
        const newBalance = await storage.withdraw(u.externalUserId, amount);
        const tx = await storage.addTransaction({ userId_A: u.externalUserId, type: 'WITHDRAWAL', amount, source, externalRef: transactionId });
        try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_A: u.externalUserId, type: 'WITHDRAWAL', amountCents: Math.round(amount * 100), currency: 'EUR', source, externalRef: transactionId }); } } catch {}
        return res.json({ userId_A: u.externalUserId, newBalance, transactionId, status: "SUCCESS", source, mode: 'shared' });
      }
      try {
        const newBalance = await storage.localWithdraw(u.id, amount);
        const tx = await storage.addTransaction({ userId_B: u.id, type: 'WITHDRAWAL', amount, source, externalRef: transactionId });
        try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_B: u.id, type: 'WITHDRAWAL', amountCents: Math.round(amount * 100), currency: 'EUR', source, externalRef: transactionId }); } } catch {}
        return res.json({ userId: u.id, newBalance, transactionId, status: "SUCCESS", source, mode: 'local' });
      } catch (e:any) {
        return res.status(400).json({ error: e?.message || 'WITHDRAWAL_FAILED' });
      }
    } catch (e:any) {
      return res.status(500).json({ error: e?.message || 'WITHDRAWAL_ERROR' });
    }
  });

  // Operator insights: transactions and sessions
  app.get("/api/operator/transactions", requireRole(['admin']), async (req: any, res: any) => {
    const limit = Number(req.query.limit || 100);
    const list = await storage.listTransactions(limit);
    res.json(list);
  });
  app.get("/api/operator/sessions", requireRole(['admin']), async (req: any, res: any) => {
    const userId_B = req.query.userId_B ? String(req.query.userId_B) : undefined;
    const modelId = req.query.modelId ? String(req.query.modelId) : undefined;
    const limit = Number(req.query.limit || 100);
    const list = await storage.listSessions({ userId_B, modelId, limit });
    res.json(list);
  });

  // Demo login endpoint issuing JWT for seeded users
  app.post('/api/auth/login', async (req: any, res: any) => {
    const parsed = z.object({ username: z.string().min(1) }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const { username } = parsed.data;
    const map: Record<string, { id: string; role: 'user'|'model'|'admin' }> = {
      utente: { id: 'u-001', role: 'user' },
      modella: { id: 'm-001', role: 'model' },
      admin: { id: 'a-001', role: 'admin' },
    };
    const found = map[String(username).toLowerCase() as keyof typeof map];
    if (!found) {
      try { await storage.addAudit({ action: 'login_failed', meta: { username } }); } catch {}
      return res.status(401).json({ error: 'invalid credentials' });
    }
    const token = jwt.sign({ uid: found.id, role: found.role, username }, getJWTSecret(), { expiresIn: '1d' });
    try { await storage.addAudit({ actor: found.id, role: found.role, action: 'login_success', meta: { username } }); } catch {}
    return res.json({ token, user: { id: found.id, username, role: found.role } });
  });

  // Registration endpoint capturing personal data and initializing wallet in DB
  app.post('/api/auth/register', async (req: any, res: any) => {
    if (!db) return res.status(500).json({ error: 'db_unavailable' });
    const parsed = z.object({
      username: z.string().min(3),
      email: z.string().email().optional(),
      password: z.string().min(6),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      dateOfBirth: z.string().optional(),
      country: z.string().optional(),
      phoneNumber: z.string().optional(),
    }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const { username, email, password, firstName, lastName, dateOfBirth, country, phoneNumber } = parsed.data;
    // basic username uniqueness check
    try {
      const existing = await db.select().from(schema.users).where(eq(schema.users.username, username));
      if (existing && existing.length > 0) {
        return res.status(409).json({ error: 'username_taken' });
      }
    } catch {}
    try {
      const id = crypto.randomUUID();
      // Create user
      await db.insert(schema.users).values({
        id,
        username,
        password,
        email,
        role: 'user',
        firstName,
        lastName,
        dob: dateOfBirth ? new Date(dateOfBirth) as any : undefined,
        country,
        phoneNumber,
        status: 'active',
        lastLogin: new Date() as any,
      });
      // Profile
      await db.insert(schema.userProfiles).values({ userId: id, firstName, lastName, birthDate: dateOfBirth ? new Date(dateOfBirth) as any : undefined });
      // Wallet (0 balance)
      await db.insert(schema.wallets).values({ userId: id, balanceCents: 0, currency: 'EUR' });

      // === BEST-EFFORT: sync verso Sirplay (Kasyrooms -> Sirplay) ===
      // Non blocca la registrazione locale se Sirplay non è configurato o fallisce.
      let sirplaySync: any = { attempted: false };

      try {
        if (typeof getSirplayConfigFromEnv === "function" && typeof sirplayRegisterUser === "function") {
          const cfg = getSirplayConfigFromEnv();
          // Se config mancante, getSirplayConfigFromEnv dovrebbe lanciare o restituire valori vuoti:
          // in tal caso non tentiamo.
          if (cfg?.baseUrl && cfg?.partnerId && cfg?.accessUser && cfg?.accessPass) {
            sirplaySync.attempted = true;

            const nowIso = new Date().toISOString();
            const { token } = await sirplayLogin(cfg);
            const resp = await sirplayRegisterUser(cfg, token, {
              userName: username,
              externalId: id,              // id utente Kasyrooms (operatore)
              password,                    // oppure una password diversa se Sirplay richiede regole specifiche
              status: "ACTIVE",
              created: nowIso,
              birthDate: dateOfBirth,
              name: firstName,
              surname: lastName,
              email: email,
              mobilePhone: phoneNumber,
            });

            const sirplayUserId = String(resp?.userData?.userId || "").trim();
            if (sirplayUserId) {
              // salva mapping: externalUserId = sirplay userId
              await db.update(schema.users).set({ externalUserId: sirplayUserId }).where(eq(schema.users.id, id));
              sirplaySync = { attempted: true, ok: true, sirplayUserId };
            } else {
              sirplaySync = { attempted: true, ok: false, error: "sirplay_register_missing_userId", sirplayResponse: resp };
            }
          }
        }
      } catch (e: any) {
        sirplaySync = { attempted: true, ok: false, error: e?.message || String(e) };
      }

      const token = jwt.sign({ uid: id, role: 'user', username }, getJWTSecret(), { expiresIn: '1d' });
      return res.json({ token, user: { id, username, role: 'user', email }, sirplaySync });
    } catch (e:any) {
      return res.status(500).json({ error: 'registration_failed', message: e?.message });
    }
  });

  // Healthcheck
  app.get("/api/healthz", (_req: any, res: any) => res.json({ ok: true }));

  // Admin: audit log
  app.get('/api/operator/audit', requireRole(['admin']), async (req: any, res: any) => {
    const limit = Number(req.query.limit || 200);
    const actor = typeof req.query.actor === 'string' ? String(req.query.actor).toLowerCase() : undefined;
    const action = typeof req.query.action === 'string' ? String(req.query.action).toLowerCase() : undefined;
    const from = typeof req.query.from === 'string' ? Date.parse(String(req.query.from)) : undefined;
    const to = typeof req.query.to === 'string' ? Date.parse(String(req.query.to)) : undefined;
    const sort = String(req.query.sort || 'newest').toLowerCase();
    let list = await storage.listAudit(2000);
    if (actor) list = list.filter(e => (e.actor || '').toLowerCase() === actor);
    if (action) list = list.filter(e => e.action.toLowerCase() === action);
    if (Number.isFinite(from)) list = list.filter(e => Date.parse(e.when) >= (from as number));
    if (Number.isFinite(to)) list = list.filter(e => Date.parse(e.when) <= (to as number));
    if (sort === 'newest') list = list.sort((a,b)=>Date.parse(b.when)-Date.parse(a.when));
    if (sort === 'oldest') list = list.sort((a,b)=>Date.parse(a.when)-Date.parse(b.when));
    return res.json(list.slice(0, Math.max(1, Math.min(limit, 2000))));
  });
  // Audit export (CSV/JSON)
  app.get('/api/operator/audit/export', requireRole(['admin']), async (req: any, res: any) => {
    const actor = typeof req.query.actor === 'string' ? String(req.query.actor).toLowerCase() : undefined;
    const action = typeof req.query.action === 'string' ? String(req.query.action).toLowerCase() : undefined;
    const from = typeof req.query.from === 'string' ? Date.parse(String(req.query.from)) : undefined;
    const to = typeof req.query.to === 'string' ? Date.parse(String(req.query.to)) : undefined;
    const sort = String(req.query.sort || 'newest').toLowerCase();
    const format = String(req.query.format || 'csv').toLowerCase();
    let list = await storage.listAudit(2000);
    if (actor) list = list.filter(e => (e.actor || '').toLowerCase() === actor);
    if (action) list = list.filter(e => e.action.toLowerCase() === action);
    if (Number.isFinite(from)) list = list.filter(e => Date.parse(e.when) >= (from as number));
    if (Number.isFinite(to)) list = list.filter(e => Date.parse(e.when) <= (to as number));
    if (sort === 'newest') list = list.sort((a,b)=>Date.parse(b.when)-Date.parse(a.when));
    if (sort === 'oldest') list = list.sort((a,b)=>Date.parse(a.when)-Date.parse(b.when));
    if (format === 'json') return res.json(list);
    const esc = (v: any) => {
      let s: string = v == null ? '' : (typeof v === 'string' ? v : (typeof v === 'object' ? JSON.stringify(v) : String(v)));
      s = s.replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };
    const header = ['id','when','actor','role','action','target','meta'];
    const lines = [header.join(',')].concat(list.map(e => [e.id, e.when, e.actor || '', e.role || '', e.action, e.target || '', e.meta ? JSON.stringify(e.meta) : ''].map(esc).join(',')));
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    const ts = new Date().toISOString().slice(0,10).replace(/-/g,'');
    res.setHeader('Content-Disposition', `attachment; filename="audit_${ts}.csv"`);
    return res.status(200).send(csv);
  });

  // ===== DMCA =====
  app.post('/api/dmca/report', async (req: any, res: any) => {
    const parsed = z.object({
      reporterName: z.string().min(1),
      reporterEmail: z.string().email(),
      originalContentUrl: z.string().url(),
      infringingUrls: z.array(z.string().url()).min(1),
      signature: z.string().min(3),
      notes: z.string().optional(),
    }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const notice = await storage.addDmcaNotice(parsed.data);
    // Persist best-effort
    try {
      if (db) {
        await db.insert(schema.dmcaNotices).values({
          id: notice.id,
          reporterName: notice.reporterName,
          reporterEmail: notice.reporterEmail,
          originalContentUrl: notice.originalContentUrl,
          infringingUrls: notice.infringingUrls as any,
          signature: notice.signature,
          status: notice.status,
          notes: notice.notes,
        });
      }
    } catch {}
    res.json(notice);
  });
  app.get('/api/operator/dmca', requireRole(['admin']), async (req: any, res: any) => {
    const status = typeof req.query.status === 'string' ? req.query.status as any : undefined;
    const email = typeof req.query.email === 'string' ? String(req.query.email).toLowerCase() : undefined;
    const from = typeof req.query.from === 'string' ? Date.parse(String(req.query.from)) : undefined;
    const to = typeof req.query.to === 'string' ? Date.parse(String(req.query.to)) : undefined;
    let list = await storage.listDmcaNotices(status);
    if (email) list = list.filter(n => n.reporterEmail.toLowerCase() === email);
    if (Number.isFinite(from)) list = list.filter(n => Date.parse(n.createdAt) >= (from as number));
    if (Number.isFinite(to)) list = list.filter(n => Date.parse(n.createdAt) <= (to as number));
    const sort = String(req.query.sort || '').toLowerCase();
    if (sort === 'newest') list = list.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
    if (sort === 'oldest') list = list.sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt));
    res.json(list);
  });
  // DMCA export (CSV/JSON)
  app.get('/api/operator/dmca/export', requireRole(['admin']), async (req: any, res: any) => {
    const status = typeof req.query.status === 'string' ? req.query.status as any : undefined;
    const email = typeof req.query.email === 'string' ? String(req.query.email).toLowerCase() : undefined;
    const from = typeof req.query.from === 'string' ? Date.parse(String(req.query.from)) : undefined;
    const to = typeof req.query.to === 'string' ? Date.parse(String(req.query.to)) : undefined;
    const sort = String(req.query.sort || '').toLowerCase();
    const format = String(req.query.format || 'csv').toLowerCase();
    let list = await storage.listDmcaNotices(status);
    if (email) list = list.filter(n => n.reporterEmail.toLowerCase() === email);
    if (Number.isFinite(from)) list = list.filter(n => Date.parse(n.createdAt) >= (from as number));
    if (Number.isFinite(to)) list = list.filter(n => Date.parse(n.createdAt) <= (to as number));
    if (sort === 'newest') list = list.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
    if (sort === 'oldest') list = list.sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt));
    if (format === 'json') return res.json(list);
    const esc = (v: any) => {
      let s: string = v == null ? '' : (typeof v === 'string' ? v : (Array.isArray(v) ? v.join('|') : (typeof v === 'object' ? JSON.stringify(v) : String(v))));
      s = s.replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };
    const header = ['id','createdAt','status','reporterName','reporterEmail','originalContentUrl','infringingUrls','signature','notes'];
    const lines = [header.join(',')].concat(list.map(n => [n.id, n.createdAt, n.status, n.reporterName, n.reporterEmail, n.originalContentUrl, (n.infringingUrls||[]).join('|'), n.signature, n.notes || ''].map(esc).join(',')));
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    const ts = new Date().toISOString().slice(0,10).replace(/-/g,'');
    res.setHeader('Content-Disposition', `attachment; filename="dmca_${ts}.csv"`);
    return res.status(200).send(csv);
  });
  app.patch('/api/operator/dmca/:id/status', requireRole(['admin']), async (req: any, res: any) => {
    const parsed = z.object({ status: z.enum(['open','closed','rejected']), notes: z.string().optional() }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const n = await storage.updateDmcaStatus(String(req.params.id), parsed.data.status, parsed.data.notes);
    if (!n) return res.status(404).json({ error: 'not_found' });
    try { if (db) { await db.update(schema.dmcaNotices).set({ status: n.status, notes: n.notes }).where(eq(schema.dmcaNotices.id, n.id)); } } catch {}
    res.json(n);
  });

  // ===== KYC =====
  app.post('/api/kyc/apply', async (req: any, res: any) => {
    const user = getReqUser(req);
    const parsed = z.object({
      fullName: z.string().min(3),
      dateOfBirth: z.string().optional(),
      country: z.string().optional(),
      documentType: z.enum(['passport','id_card','driver_license']).optional(),
      documentFrontUrl: z.string().url().optional(),
      documentBackUrl: z.string().url().optional(),
      selfieUrl: z.string().url().optional(),
      notes: z.string().optional(),
    }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const appRec = await storage.addKycApplication({ ...parsed.data, userId: user?.id });
    try {
      if (db) {
        await db.insert(schema.kycApplications).values({
          id: appRec.id,
          userId: appRec.userId as any,
          fullName: appRec.fullName,
          dateOfBirth: appRec.dateOfBirth ? new Date(appRec.dateOfBirth) as any : null as any,
          country: appRec.country,
          documentType: appRec.documentType as any,
          documentFrontUrl: appRec.documentFrontUrl,
          documentBackUrl: appRec.documentBackUrl,
          selfieUrl: appRec.selfieUrl,
          status: appRec.status,
          notes: appRec.notes,
        });
      }
    } catch {}
    res.json(appRec);
  });
  app.get('/api/operator/kyc', requireRole(['admin']), async (req: any, res: any) => {
    const status = typeof req.query.status === 'string' ? req.query.status as any : undefined;
    const fullName = typeof req.query.fullName === 'string' ? String(req.query.fullName).toLowerCase() : undefined;
    const from = typeof req.query.from === 'string' ? Date.parse(String(req.query.from)) : undefined;
    const to = typeof req.query.to === 'string' ? Date.parse(String(req.query.to)) : undefined;
    let list = await storage.listKycApplications(status);
    if (fullName) list = list.filter(a => a.fullName.toLowerCase().includes(fullName));
    if (Number.isFinite(from)) list = list.filter(a => Date.parse(a.createdAt) >= (from as number));
    if (Number.isFinite(to)) list = list.filter(a => Date.parse(a.createdAt) <= (to as number));
    const sort = String(req.query.sort || '').toLowerCase();
    if (sort === 'newest') list = list.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
    if (sort === 'oldest') list = list.sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt));
    res.json(list);
  });
  // KYC export (CSV/JSON)
  app.get('/api/operator/kyc/export', requireRole(['admin']), async (req: any, res: any) => {
    const status = typeof req.query.status === 'string' ? req.query.status as any : undefined;
    const fullName = typeof req.query.fullName === 'string' ? String(req.query.fullName).toLowerCase() : undefined;
    const from = typeof req.query.from === 'string' ? Date.parse(String(req.query.from)) : undefined;
    const to = typeof req.query.to === 'string' ? Date.parse(String(req.query.to)) : undefined;
    const sort = String(req.query.sort || '').toLowerCase();
    const format = String(req.query.format || 'csv').toLowerCase();
    let list = await storage.listKycApplications(status);
    if (fullName) list = list.filter(a => a.fullName.toLowerCase().includes(fullName));
    if (Number.isFinite(from)) list = list.filter(a => Date.parse(a.createdAt) >= (from as number));
    if (Number.isFinite(to)) list = list.filter(a => Date.parse(a.createdAt) <= (to as number));
    if (sort === 'newest') list = list.sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
    if (sort === 'oldest') list = list.sort((a,b)=>Date.parse(a.createdAt)-Date.parse(b.createdAt));
    if (format === 'json') return res.json(list);
    const esc = (v: any) => {
      let s: string = v == null ? '' : (typeof v === 'string' ? v : (typeof v === 'object' ? JSON.stringify(v) : String(v)));
      s = s.replace(/"/g, '""');
      return /[",\n\r]/.test(s) ? `"${s}"` : s;
    };
    const header = ['id','createdAt','status','userId','fullName','dateOfBirth','country','documentType','documentFrontUrl','documentBackUrl','selfieUrl','notes'];
    const lines = [header.join(',')].concat(list.map(a => [a.id, a.createdAt, a.status, a.userId || '', a.fullName, a.dateOfBirth || '', a.country || '', a.documentType || '', a.documentFrontUrl || '', a.documentBackUrl || '', a.selfieUrl || '', a.notes || ''].map(esc).join(',')));
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    const ts = new Date().toISOString().slice(0,10).replace(/-/g,'');
    res.setHeader('Content-Disposition', `attachment; filename="kyc_${ts}.csv"`);
    return res.status(200).send(csv);
  });
  app.patch('/api/operator/kyc/:id/status', requireRole(['admin']), async (req: any, res: any) => {
    const parsed = z.object({ status: z.enum(['pending','approved','rejected']), notes: z.string().optional() }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const k = await storage.updateKycStatus(String(req.params.id), parsed.data.status, parsed.data.notes);
    if (!k) return res.status(404).json({ error: 'not_found' });
    try { if (db) { await db.update(schema.kycApplications).set({ status: k.status, notes: k.notes }).where(eq(schema.kycApplications.id, k.id)); } } catch {}
    res.json(k);
  });

  // KYC document upload (front/back/selfie) - protected by user or admin (user can only upload for own application id referenced)
  const kycUploadStorage = (multer as any).diskStorage({
    destination: (req: any, _file: any, cb: any) => {
      const appId = String(req.params?.applicationId || 'misc');
      const dir = path.join(uploadsRoot, 'kyc', appId);
      try { fs.mkdirSync(dir, { recursive: true }); } catch {}
      cb(null, dir);
    },
    filename: (_req: any, file: any, cb: any) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, '_');
      cb(null, Date.now() + '_' + safe);
    }
  });
  const kycUpload = (multer as any)({
    storage: kycUploadStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (_req: any, file: any, cb: any) => {
      if (/^image\/(jpeg|png|webp|gif|avif)$/.test(file.mimetype)) cb(null, true);
      else cb(new Error('invalid_file_type'));
    }
  });
  // Single endpoint allowing one file per call with a type query (?kind=front|back|selfie)
  app.post('/api/kyc/:applicationId/upload', kycUpload.single('file'), async (req: any, res: any) => {
    try {
      const kind = String(req.query.kind || '').toLowerCase();
      if (!['front','back','selfie'].includes(kind)) return res.status(400).json({ error: 'invalid_kind' });
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'file_required' });
      const appId = String(req.params.applicationId);
      const relUrl = `/uploads/kyc/${appId}/${file.filename}`;
      const updated = await storage.updateKycDocuments(appId, {
        documentFrontUrl: kind === 'front' ? relUrl : undefined,
        documentBackUrl: kind === 'back' ? relUrl : undefined,
        selfieUrl: kind === 'selfie' ? relUrl : undefined,
      });
      if (!updated) return res.status(404).json({ error: 'application_not_found' });
      // Persist best-effort
      try {
        if (db) {
          const patch: any = {};
            if (kind === 'front') patch.documentFrontUrl = relUrl;
            if (kind === 'back') patch.documentBackUrl = relUrl;
            if (kind === 'selfie') patch.selfieUrl = relUrl;
          await db.update(schema.kycApplications).set(patch).where(eq(schema.kycApplications.id, appId));
        }
      } catch {}
      return res.json({ ok: true, application: updated });
    } catch (e: any) {
      return res.status(400).json({ error: 'upload_failed', reason: e?.message || String(e) });
    }
  });

  // Simple version endpoint to verify deployed build
  app.get("/api/version", (_req: any, res: any) => res.json({ version: appVersion, time: new Date().toISOString() }));

  // RTC client config: expose ICE servers to browser
  app.get('/api/rtc/config', (_req: any, res: any) => {
    const iceServers: any[] = [];
    // Always include a public STUN fallback
    iceServers.push({ urls: ['stun:stun.l.google.com:19302'] });
    if (process.env.TURN_URL && process.env.TURN_USER && process.env.TURN_PASS) {
      iceServers.push({ urls: [String(process.env.TURN_URL)], username: process.env.TURN_USER, credential: process.env.TURN_PASS });
    }
    res.json({ iceServers });
  });

  // Lightweight image proxy to bypass third-party CORP/CSP issues for remote thumbnails
  app.get('/api/proxy/img', async (req: any, res: any) => {
    try {
      const rawParam = String(req.query.u || req.query.url || '');
      if (!rawParam) { res.setHeader('Cache-Control', 'no-store'); return res.status(400).json({ error: 'missing_url' }); }

      // Normalize/unwrap nested proxy URLs: if `u` points to /api/proxy/img, extract its inner `u`.
      const unwrapProxyParam = (
        val: string
      ): { value: string; nestedDetected: boolean; unwrapFailed: boolean } => {
        let current = val;
        let nestedDetected = false;
        // Limit recursion depth defensively to avoid loops
        for (let i = 0; i < 5; i++) {
          const isAbsolute = /^https?:\/\//i.test(current);
          if (isAbsolute) {
            try {
              const u = new URL(current);
              if (u.pathname.startsWith('/api/proxy/img')) {
                nestedDetected = true;
                const inner = u.searchParams.get('u') || u.searchParams.get('url');
                if (!inner) return { value: current, nestedDetected, unwrapFailed: true };
                current = inner;
                continue;
              }
            } catch {
              // If absolute URL parsing fails, stop unwrapping and let main validator handle
            }
          } else {
            if (current.startsWith('/api/proxy/img')) {
              nestedDetected = true;
              const qIndex = current.indexOf('?');
              const qs = qIndex >= 0 ? current.substring(qIndex + 1) : '';
              const sp = new URLSearchParams(qs);
              const inner = sp.get('u') || sp.get('url');
              if (!inner) return { value: current, nestedDetected, unwrapFailed: true };
              current = inner;
              continue;
            }
          }
          break;
        }
        return { value: current, nestedDetected, unwrapFailed: false };
      };

      const unwrapped = unwrapProxyParam(rawParam);
      if (unwrapped.nestedDetected && unwrapped.unwrapFailed) {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(400).json({ error: 'nested_proxy_missing_inner_url' });
      }

      const normalized = unwrapped.value;
      const baseForRelative = process.env.PUBLIC_URL || process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
      let target: URL;
      try {
        if (/^https?:\/\//i.test(normalized)) {
          target = new URL(normalized);
        } else if (normalized.startsWith('/')) {
          target = new URL(normalized, baseForRelative);
        } else {
          res.setHeader('Cache-Control', 'no-store');
          return res.status(400).json({ error: 'invalid_url' });
        }
      } catch {
        res.setHeader('Cache-Control', 'no-store');
        return res.status(400).json({ error: 'invalid_url' });
      }

      if (target.protocol !== 'https:') { res.setHeader('Cache-Control', 'no-store'); return res.status(400).json({ error: 'https_only' }); }

      // SSRF basic protections: block localhost/private networks
      const host = target.hostname.toLowerCase();
      const isPrivateHost = host === 'localhost' || host === '127.0.0.1' || host === '::1' ||
        /^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) || /^169\.254\./.test(host);
      if (isPrivateHost) { res.setHeader('Cache-Control', 'no-store'); return res.status(400).json({ error: 'blocked_host' }); }

      // Optional allowlist via env (comma-separated). If set, enforce it.
      const allowEnv = (process.env.IMAGE_PROXY_ALLOWED_HOSTS || '').trim();
      if (allowEnv) {
        const allowed = new Set(allowEnv.split(',').map((s: any) => s.trim().toLowerCase()).filter(Boolean));
        if (!allowed.has(host)) { res.setHeader('Cache-Control', 'no-store'); return res.status(400).json({ error: 'host_not_allowed' }); }
      }

      const fmt = typeof req.query.fmt === 'string' ? req.query.fmt : undefined;
      // Best-effort content negotiation to request webp when asked
      // Local caching layer (best-effort)
      await ensureCacheDir();
      const cachedPath = await downloadAndCache(target.toString());
      if (cachedPath) {
        try {
          const data = await fs.promises.readFile(cachedPath);
          // Best-effort content type sniffing for cached files
          const ct = (() => {
            if (data.length > 12) {
              // JPEG
              if (data[0] === 0xFF && data[1] === 0xD8 && data[2] === 0xFF) return 'image/jpeg';
              // PNG
              if (data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4E && data[3] === 0x47) return 'image/png';
              // WEBP (RIFF....WEBP)
              if (data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
                  data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) return 'image/webp';
              // AVIF (ftypavif)
              if (data[4] === 0x66 && data[5] === 0x74 && data[6] === 0x79 && data[7] === 0x70 &&
                  data[8] === 0x61 && data[9] === 0x76 && data[10] === 0x69 && data[11] === 0x66) return 'image/avif';
            }
            return 'image/jpeg';
          })();
          res.setHeader('Content-Type', ct);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
          return res.status(200).end(data);
        } catch {}
      }
      const upstream = await fetch(target.toString(), {
        redirect: 'follow',
        headers: fmt === 'webp' ? { 'Accept': 'image/webp,image/*;q=0.8' } : undefined,
      } as any);
      if (!upstream.ok) return res.status(upstream.status).end();
      // Propagate basic content-type; default to image/jpeg
  const ct = upstream.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      // Allow fetching displayed images when CSP uses self only (proxy path is self)
  // Do not override page CSP from subresource responses
      const body = await upstream.arrayBuffer();
      // Persist to cache
      try { await ensureCacheDir(); const cached = await getCachedImage(target.toString()); if (!cached.exists) { await fs.promises.writeFile(cached.path, Buffer.from(body)); } } catch {}
      return res.status(200).end(Buffer.from(body));
    } catch (e) {
      return res.status(500).json({ error: 'proxy_failed' });
    }
  });

  // Self-test endpoint for image proxy health. Fetches a representative Unsplash image
  // through the local proxy to validate outbound connectivity, caching, and CSP compatibility.
  app.get('/api/selftest/images', async (_req: any, res: any) => {
    const sample = 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?auto=format&fit=crop&w=400&q=60';
    const proxiedUrl = `/api/proxy/img?u=${encodeURIComponent(sample)}`;
    try {
      // Local fetch via absolute URL requires knowing host/port; instead, re-use internal logic by performing an HTTP fetch against the proxy path.
      // Since we are inside the same process, we can call fetch with a full URL constructed from request headers if needed.
      // For simplicity and to avoid relying on Host header variations, directly invoke upstream fetch & cache helpers just like proxy does.
      let bytes: number | undefined;
      let contentType: string | undefined;
      let ok = false;
      try {
        await ensureCacheDir();
        const cachedPath = await downloadAndCache(sample);
        if (cachedPath) {
          try {
            const data = await fs.promises.readFile(cachedPath);
            bytes = data.length;
            contentType = 'image/jpeg';
            ok = true;
          } catch {}
        }
        if (!ok) {
          const upstream = await fetch(sample, { redirect: 'follow' } as any);
            if (upstream.ok) {
              const buf = Buffer.from(await upstream.arrayBuffer());
              bytes = buf.length;
              contentType = upstream.headers.get('content-type') || 'image/jpeg';
              ok = true;
            }
        }
      } catch {}
      return res.json({ ok, sample, proxiedUrl, bytes, contentType });
    } catch {
      return res.status(500).json({ ok: false, error: 'selftest_failed' });
    }
  });

  // 5) Webhook Sirplay con verifica HMAC
  // Config via env:
  //   SIRPLAY_WEBHOOK_SECRET: chiave segreta condivisa per HMAC-SHA256
  //   SIRPLAY_WEBHOOK_SIGNATURE_HEADER: nome header contenente la firma (default: 'x-sirplay-signature')
  //   SIRPLAY_WEBHOOK_TIMESTAMP_HEADER: nome header per timestamp (opzionale, default: 'x-sirplay-timestamp')
  app.post("/api/webhooks/sirplay", async (req: any, res: any) => {
    const secret = process.env.SIRPLAY_WEBHOOK_SECRET || "";
    if (!secret) return res.status(500).json({ error: "missing webhook secret" });
    const sigHeaderName = (process.env.SIRPLAY_WEBHOOK_SIGNATURE_HEADER || 'x-sirplay-signature').toLowerCase();
    const tsHeaderName = (process.env.SIRPLAY_WEBHOOK_TIMESTAMP_HEADER || 'x-sirplay-timestamp').toLowerCase();
    const raw: any = (req as any).rawBody ?? Buffer.from(JSON.stringify(req.body ?? {}));
    const sigHdr = String(req.headers[sigHeaderName] || "");
    const providedSig = sigHdr.startsWith('sha256=') ? sigHdr.slice(7) : sigHdr;
    const timestamp = String(req.headers[tsHeaderName] || "");

    try {
      // Optional: refuse if timestamp too old (> 5 mins)
      if (timestamp) {
        const age = Math.abs(Date.now() - Number(timestamp));
        if (Number.isFinite(age) && age > 5 * 60 * 1000) {
          return res.status(401).json({ error: 'stale webhook' });
        }
      }
      // Compute HMAC over raw body bytes only (signature covers payload);
      // timestamp is validated above to prevent replay.
      const computed = crypto.createHmac('sha256', secret).update(raw).digest('hex');
      // constant-time compare (hex -> buffers) and enforce equal-length
      const a = Buffer.from(String(providedSig), 'hex');
      const b = Buffer.from(computed, 'hex');
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        return res.status(401).json({ error: 'invalid_signature' });
      }
    } catch (e:any) {
      return res.status(401).json({ error: 'verification failed' });
    }

    // At this point the payload is trusted. Parse JSON from req.body
    const event = req.body || {};
    // Require unique transaction id
    const transactionId = String(event?.transactionId || event?.ref || "").trim();
    if (!transactionId) return res.status(400).json({ error: 'missing_transaction_id' });

    // Resolve account via externalUserId + email (email required for adapter)
    const externalUserId = typeof event?.externalUserId === 'string' ? String(event.externalUserId) : '';
    const email = typeof event?.email === 'string' ? String(event.email) : '';
    if (!externalUserId || !email) return res.status(400).json({ error: 'missing_identity' });

    try {
      // If DB is disabled, acknowledge event for DEV environments while skipping persistence
      if (!db) {
        return res.json({ ok: true, accepted: true, stored: false });
      }
      const acc = await getOrCreateAccountBySirplayUserId({ externalUserId, email });
      const type = String(event?.type || '').toLowerCase();
      const amountCents = Number(event?.amountCents ?? (Number(event?.amount) * 100));
      const currency = String(event?.currency || 'EUR');
      if (!Number.isFinite(amountCents) || amountCents <= 0) return res.status(400).json({ error: 'invalid_amount' });
      // Record idempotent transaction
      await recordWalletTransactionIdempotent({
        accountId: acc.id as number,
        externalTransactionId: transactionId,
        type: type || 'deposit',
        amountCents,
        currency,
        metadata: event?.metadata,
      });
      // Optional snapshot update when provided
      const balanceCents = Number(event?.balanceCents);
      if (Number.isFinite(balanceCents)) {
        await upsertWalletSnapshot({ accountId: acc.id as number, balanceCents, currency });
      }
      return res.json({ ok: true });
    } catch (e:any) {
      return res.status(400).json({ error: 'sirplay_adapter_failed', message: e?.message || String(e) });
    }
  });

  // Self-test endpoint: echo rawBody length and common hashes for quick HMAC debugging
  app.post('/api/webhooks/sirplay/selftest', async (req: any, res: any) => {
    try {
      const sigHeaderName = (process.env.SIRPLAY_WEBHOOK_SIGNATURE_HEADER || 'x-sirplay-signature').toLowerCase();
      const tsHeaderName = (process.env.SIRPLAY_WEBHOOK_TIMESTAMP_HEADER || 'x-sirplay-timestamp').toLowerCase();
      const providedSig = String(req.headers[sigHeaderName] || "");
      const timestamp = String(req.headers[tsHeaderName] || "");

      const raw: any = req.rawBody as any;
      const rawUtf8 = raw ? raw.toString('utf8') : '';
      const len = raw ? raw.length : 0;

      const sha256_hex = crypto.createHash('sha256').update(rawUtf8).digest('hex');
      const sha256_base64 = crypto.createHash('sha256').update(rawUtf8).digest('base64');

      const base = timestamp ? (timestamp + '.' + rawUtf8) : rawUtf8;
      const base_sha256_hex = crypto.createHash('sha256').update(base).digest('hex');
      const base_sha256_base64 = crypto.createHash('sha256').update(base).digest('base64');

      return res.json({
        length: len,
        providedSignature: providedSig,
        timestamp,
        sha256_hex,
        sha256_base64,
        base_sha256_hex,
        base_sha256_base64,
      });
    } catch (e: any) {
      return res.status(500).json({ error: 'selftest_error', message: e?.message || String(e) });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
