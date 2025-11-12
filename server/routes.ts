
import type { Express } from "express";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import crypto from "crypto";
import { db, schema } from "./db";
import multer from "multer";
import path from "path";
import fs from "fs";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { ensureCacheDir, downloadAndCache } from "./image-cache";
import { getCachedImage } from "./image-cache";

// Read JWT secret lazily to ensure dotenv/config has been applied by the entrypoint
const getJWTSecret = () => process.env.JWT_SECRET || "dev-secret";

export async function registerRoutes(app: Express, opts?: { version?: string }) {
  const appVersion = opts?.version || "dev";
  // Force proxying of external images at API level when enabled, so the client always receives self-origin URLs
  const FORCE_PROXY_IMAGES = process.env.FORCE_PROXY_IMAGES === '1';
  const proxifyImage = (u?: string) => {
    if (!u) return u;
    if (u.startsWith('/')) return u;
    try { const url = new URL(u); if (url.protocol === 'http:' || url.protocol === 'https:') {
      return `/api/proxy/img?u=${encodeURIComponent(u)}`;
    } } catch {}
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
  function getReqUser(req: any): ReqUser {
    const auth = req.headers['authorization'];
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length);
      try {
        const payload = jwt.verify(token, getJWTSecret()) as any;
        return { id: String(payload.uid), role: payload.role as any, username: payload.username };
      } catch {}
    }
    const role = (req.headers['x-role'] || req.headers['x-user-role']) as string | undefined;
    const uid = (req.headers['x-user-id'] || req.headers['x-uid']) as string | undefined;
    if (role && uid) return { id: String(uid), role: role as any };
    return null;
  }
  // In production, fail-fast if JWT secret is not configured securely
  if (process.env.NODE_ENV === 'production' && getJWTSecret() === 'dev-secret') {
    console.error('[security] JWT_SECRET is using an insecure default in production. Set JWT_SECRET in environment.');
    // Surface a clear failure instead of running insecurely
    throw new Error('JWT_SECRET not configured');
  }
  // ===== File uploads (model photos) =====
  const uploadsRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "uploads");
  const uploadStorage = (multer as any).diskStorage({
    destination: (req: any, _file: any, cb: any) => {
      const modelId = String(req.params?.id || (req as any).user?.id || "misc");
      const dir = path.join(uploadsRoot, "models", modelId);
      try { fs.mkdirSync(dir, { recursive: true }); } catch {}
      cb(null, dir);
    },
    filename: (_req: any, file: any, cb: any) => {
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]+/g, "_");
      const name = `${Date.now()}_${safe}`;
      cb(null, name);
    }
  });
  const upload = (multer as any)({
    storage: uploadStorage,
    limits: { fileSize: 8 * 1024 * 1024 }, // 8MB
    fileFilter: (_req: any, file: any, cb: any) => {
      if (/^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/.test(file.mimetype)) cb(null, true);
      else cb(new Error("invalid_file_type"));
    }
  });


  function requireRole(roles: Array<'user'|'model'|'admin'>) {
    return (req: any, res: any, next: any) => {
      const u = getReqUser(req);
      if (!u || !roles.includes(u.role)) return res.status(403).json({ error: 'forbidden' });
      (req as any).user = u;
      next();
    };
  }

  function requireModelSelfOrAdmin() {
    return (req: any, res: any, next: any) => {
      const u = getReqUser(req);
      if (!u) return res.status(403).json({ error: 'forbidden' });
      if (u.role === 'admin') { (req as any).user = u; return next(); }
      if (u.role === 'model' && String(req.params.id) === u.id) { (req as any).user = u; return next(); }
      return res.status(403).json({ error: 'forbidden' });
    };
  }
  // Wallet mode is per-user: if a local user is mapped to an external user (Sirplay/Kasynoir), we use the shared wallet
  // MODELS (demo data for homepage)
  app.get("/api/models", async (req, res) => {
    // Optional grouping mode to avoid path conflicts in some deployments: /api/models?home=1&favs=a,b,c
    const homeMode = String(req.query.home || '').toLowerCase();
    if (homeMode === '1' || homeMode === 'true') {
      const u = getReqUser(req);
      const favsOverride = typeof req.query.favs === 'string' && (req.query.favs as string).trim().length > 0
        ? (req.query.favs as string).split(',').map(s=>s.trim()).filter(Boolean)
        : undefined;
      const result = await storage.listModelsHome({ userId: u?.id, favoritesOverride: favsOverride });
      return res.json(result);
    }

    const filters: any = {};
    if (req.query.online === "true") filters.isOnline = true;
    if (req.query.new === "true") filters.isNew = true;
    if (req.query.sortBy === "rating" || req.query.sortBy === "viewers") filters.sortBy = req.query.sortBy;
    if (req.query.search) {
      // Require authentication for search feature
      const u = getReqUser(req);
      if (!u) return res.status(401).json({ error: 'login_required' });
      filters.search = req.query.search as string;
    }
    if (typeof req.query.country === 'string' && req.query.country.trim().length>0) filters.country = String(req.query.country);
    if (typeof req.query.language === 'string' && req.query.language.trim().length>0) filters.language = String(req.query.language);
    if (typeof req.query.specialty === 'string' && req.query.specialty.trim().length>0) filters.specialty = String(req.query.specialty);
    const list = await storage.listModels(filters);
    res.json(FORCE_PROXY_IMAGES ? list.map(proxifyModel) : list);
  });

  // Home grouping endpoint: favorites vs others, grouped by status
  // Supports server-side favorites (from auth user) or client-provided favorites via ?favs=id1,id2
  app.get("/api/models/home", async (req, res) => {
    const u = getReqUser(req);
    const favsOverride = typeof req.query.favs === 'string' && (req.query.favs as string).trim().length > 0
      ? (req.query.favs as string).split(',').map(s=>s.trim()).filter(Boolean)
      : undefined;
    const result = await storage.listModelsHome({ userId: u?.id, favoritesOverride: favsOverride });
    res.json(proxifyHomeGroups(result));
  });
  // Aliases to avoid potential route-order conflicts on some deployments
  app.get("/api/models-home", async (req, res) => {
    const u = getReqUser(req);
    const favsOverride = typeof req.query.favs === 'string' && (req.query.favs as string).trim().length > 0
      ? (req.query.favs as string).split(',').map(s=>s.trim()).filter(Boolean)
      : undefined;
    const result = await storage.listModelsHome({ userId: u?.id, favoritesOverride: favsOverride });
    res.json(proxifyHomeGroups(result));
  });
  app.get("/api/home/models", async (req, res) => {
    const u = getReqUser(req);
    const favsOverride = typeof req.query.favs === 'string' && (req.query.favs as string).trim().length > 0
      ? (req.query.favs as string).split(',').map(s=>s.trim()).filter(Boolean)
      : undefined;
    const result = await storage.listModelsHome({ userId: u?.id, favoritesOverride: favsOverride });
    res.json(proxifyHomeGroups(result));
  });

  // Online models count (used by filters bar)
  app.get("/api/stats/online-count", async (_req, res) => {
    const list = await storage.listModels({ isOnline: true });
    res.json({ count: list.length });
  });

  // Proxy-safe home grouping endpoint under /api/stats
  app.get("/api/stats/home-groups", async (req, res) => {
    const u = getReqUser(req);
    const favsOverride = typeof req.query.favs === 'string' && (req.query.favs as string).trim().length > 0
      ? (req.query.favs as string).split(',').map(s=>s.trim()).filter(Boolean)
      : undefined;
    const result = await storage.listModelsHome({ userId: u?.id, favoritesOverride: favsOverride });
    res.json(result);
  });

  app.get("/api/models/:id", async (req, res) => {
    const m = await storage.getModel(req.params.id);
    if (!m) return res.status(404).json({ error: "Model not found" });
    res.json(FORCE_PROXY_IMAGES ? proxifyModel(m) : m);
  });

  app.patch("/api/models/:id/status", requireModelSelfOrAdmin(), async (req, res) => {
    const m = await storage.setModelOnline(req.params.id, !!req.body?.isOnline);
    if (!m) return res.status(404).json({ error: "Model not found" });
    res.json(m);
  });

  // Toggle model visibility (home listing)
  app.patch("/api/models/:id/visible", requireModelSelfOrAdmin(), async (req, res) => {
    const m = await storage.setVisible(req.params.id, !!req.body?.visible);
    if (!m) return res.status(404).json({ error: "Model not found" });
    res.json(m);
  });

  // Set busy status (when in private show)
  app.patch("/api/models/:id/busy", requireModelSelfOrAdmin(), async (req, res) => {
    const m = await storage.setModelBusy(req.params.id, !!req.body?.isBusy);
    if (!m) return res.status(404).json({ error: "Model not found" });
    res.json(m);
  });

  // Private session lifecycle (optional, for operator insights)
  app.post("/api/sessions/start", async (req, res) => {
    const schemaBody = z.object({ userId_B: z.string().min(1), modelId: z.string().min(1) });
    const parsed = schemaBody.safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    const { userId_B, modelId } = parsed.data;
    const s = await storage.startSession(userId_B, modelId);
    // Best-effort persist to DB
    try {
      if (db) {
        await db.insert(schema.sessions).values({ id: s.id, userId_B, modelId, startedAt: new Date() as any });
      }
    } catch {}
    res.json(s);
  });
  app.post("/api/sessions/:id/end", async (req, res) => {
    const parsed = z.object({ durationSec: z.number().int().nonnegative().optional(), totalCharged: z.number().nonnegative().optional() }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const { durationSec, totalCharged } = parsed.data;
    const s = await storage.endSession(req.params.id, { durationSec, totalCharged });
    if (!s) return res.status(404).json({ error: "session not found" });
    // Best-effort persist to DB
    try {
      if (db) {
        await db.update(schema.sessions)
          .set({ endedAt: new Date() as any, durationSec: durationSec ?? s.durationSec ?? 0, totalChargedCents: typeof totalCharged === 'number' ? Math.round(totalCharged * 100) : (s.totalCharged ? Math.round(s.totalCharged * 100) : 0) })
          .where(eq(schema.sessions.id, req.params.id));
      }
    } catch {}
    res.json(s);
  });

  // Aliases for profile actions per spec
  app.post('/api/models/:id/start-preview', async (req, res) => {
    // Simulate preview start; client enforces 60s timer
    const expiresAt = new Date(Date.now() + 60_000).toISOString();
    res.json({ ok: true, expiresAt });
  });
  app.post('/api/models/:id/start-private', async (req, res) => {
    const u = getReqUser(req);
    if (!u || u.role !== 'user') return res.status(403).json({ error: 'forbidden' });
    const modelId = String(req.params.id);
    const s = await storage.startSession(u.id, modelId);
    await storage.setModelBusy(modelId, true);
    res.json(s);
  });

  // Tip a model (deduct user balance and log transaction)
  app.post('/api/models/:id/tip', requireRole(['user','admin']), async (req, res) => {
    const u = (req as any).user as ReqUser;
    const parsed = z.object({ amount: z.number().positive().max(10000) }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const amount = parsed.data.amount;
    const modelId = String(req.params.id);
    try {
      // Decide wallet mode based on external binding
      const user = await storage.getUser(u!.id);
      if (!user) return res.status(404).json({ error: 'user_not_found' });
      if (user.externalUserId) {
        const bal = await storage.getBalance(user.externalUserId);
        if (bal < amount) return res.status(400).json({ error: 'INSUFFICIENT_FUNDS' });
        await storage.withdraw(user.externalUserId, amount);
        const tx = await storage.addTransaction({ userId_A: user.externalUserId, type: 'CHARGE', amount, source: `tip:${modelId}` });
        try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_A: user.externalUserId, type: 'CHARGE', amountCents: Math.round(amount*100), currency: 'EUR', source: `tip:${modelId}` }); } } catch {}
      } else {
        try {
          await storage.localWithdraw(user.id, amount);
        } catch (e:any) {
          return res.status(400).json({ error: 'INSUFFICIENT_FUNDS' });
        }
        const tx = await storage.addTransaction({ userId_B: user.id, type: 'CHARGE', amount, source: `tip:${modelId}` });
        try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_B: user.id, type: 'CHARGE', amountCents: Math.round(amount*100), currency: 'EUR', source: `tip:${modelId}` }); } } catch {}
      }
      try { await storage.addAudit({ actor: u!.id, role: u!.role, action: 'tip', target: modelId, meta: { amount } }); } catch {}
      return res.json({ ok: true });
    } catch (e:any) {
      return res.status(500).json({ error: 'TIP_FAILED', message: e?.message });
    }
  });

  // Update model profile (simple patch)
  app.patch("/api/models/:id", requireModelSelfOrAdmin(), async (req, res) => {
    const m = await storage.updateModelProfile(req.params.id, req.body ?? {});
    if (!m) return res.status(404).json({ error: "Model not found" });
    res.json(m);
  });
  // Model photos
  app.post("/api/models/:id/photos", requireModelSelfOrAdmin(), async (req, res) => {
    const parsed = z.object({ url: z.string().min(1).refine((v)=>/^https?:\/\//.test(v) || v.startsWith('/uploads/'), { message: 'url must be http(s) or /uploads path' }) }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    const photos = await storage.addModelPhoto(req.params.id, parsed.data.url);
    if (!photos) return res.status(404).json({ error: "Model not found" });
    res.json({ photos });
  });
  // Upload photo from local file
  app.post("/api/models/:id/photos/upload", requireModelSelfOrAdmin(), (upload as any).single('photo'), async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'photo file required' });
      const modelId = String(req.params.id);
      const relUrl = `/uploads/models/${modelId}/${file.filename}`;
      const photos = await storage.addModelPhoto(modelId, relUrl);
      if (!photos) return res.status(404).json({ error: 'Model not found' });
      return res.json({ photos });
    } catch (e: any) {
      return res.status(400).json({ error: 'upload_failed', reason: e?.message || String(e) });
    }
  });
  app.get("/api/models/:id/photos", async (req, res) => {
    const photos = await storage.listModelPhotos(req.params.id);
    res.json({ photos });
  });

  // Aliases per spec (model account)
  app.post('/api/models/update-status', requireRole(['model','admin']), async (req, res) => {
    const parsed = z.object({ model_id: z.string().optional(), status: z.enum(['online','offline','busy']).optional(), visible: z.boolean().optional() }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const { model_id, status, visible } = parsed.data;
    const id = String(model_id || (getReqUser(req)?.id || ''));
    if (!id) return res.status(400).json({ error: 'model_id required' });
    if (typeof visible === 'boolean') await storage.setVisible(id, !!visible);
    if (status === 'online') await storage.setModelOnline(id, true);
    else if (status === 'offline') await storage.setModelOnline(id, false);
    else if (status === 'busy') await storage.setModelBusy(id, true);
    const m = await storage.getModel(id);
    if (!m) return res.status(404).json({ error: 'Model not found' });
    res.json(m);
  });
  app.post('/api/models/upload-photo', requireRole(['model','admin']), async (req, res) => {
    const u = getReqUser(req);
    if (!u) return res.status(403).json({ error: 'forbidden' });
    const parsed = z.object({ url: z.string().min(1).refine((v)=>/^https?:\/\//.test(v) || v.startsWith('/uploads/'), { message: 'url must be http(s) or /uploads path' }) }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const photos = await storage.addModelPhoto(u.id, parsed.data.url);
    if (!photos) return res.status(404).json({ error: 'Model not found' });
    res.json({ photos });
  });
  // Upload by logged-in model
  app.post('/api/models/upload-photo-file', requireRole(['model','admin']), (upload as any).single('photo'), async (req: any, res) => {
    const u = (req as any).user as ReqUser;
    if (!u) return res.status(403).json({ error: 'forbidden' });
    try {
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'photo file required' });
      const relUrl = `/uploads/models/${u.id}/${file.filename}`;
      const photos = await storage.addModelPhoto(u.id, relUrl);
      if (!photos) return res.status(404).json({ error: 'Model not found' });
      res.json({ photos });
    } catch (e: any) {
      return res.status(400).json({ error: 'upload_failed', reason: e?.message || String(e) });
    }
  });
  app.get('/api/models/gallery', requireRole(['model','admin']), async (req, res) => {
    const u = getReqUser(req);
    if (!u) return res.status(403).json({ error: 'forbidden' });
    const photos = await storage.listModelPhotos(u.id);
    res.json({ photos });
  });

  // ===== Ratings & Views (real-time, persisted where possible) =====
  // Increment view counter (throttling handled client-side per session)
  app.post('/api/models/:id/view', async (req, res) => {
    const id = String(req.params.id);
    const m = await storage.getModel(id);
    if (!m) return res.status(404).json({ error: 'Model not found' });
    m.viewerCount = (m.viewerCount || 0) + 1;
    // Try to persist in DB as well (best-effort)
    try { if (db) { await db.update(schema.models).set({ viewerCount: m.viewerCount }).where(eq(schema.models.id, id)); } } catch {}
    return res.json({ viewerCount: m.viewerCount });
  });

  // Set or update a star rating (1..5) for the current user
  app.post('/api/models/:id/rate', requireRole(['user','model','admin']), async (req, res) => {
    const id = String(req.params.id);
    const u = (req as any).user as ReqUser;
    if (!u) return res.status(401).json({ error: 'unauthorized' });
    const parsed = z.object({ stars: z.number().int().min(1).max(5) }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const stars = parsed.data.stars;
    const m = await storage.getModel(id);
    if (!m) return res.status(404).json({ error: 'Model not found' });
    if (!db) return res.status(500).json({ error: 'db_unavailable' });
    try {
      // Upsert rating per user
      const existing = await db.select().from(schema.modelRatings).where(and(eq(schema.modelRatings.modelId, id), eq(schema.modelRatings.userId, u.id)));
      if (existing && existing.length > 0) {
        await db.update(schema.modelRatings).set({ stars, updatedAt: new Date() as any }).where(and(eq(schema.modelRatings.modelId, id), eq(schema.modelRatings.userId, u.id)));
      } else {
        await db.insert(schema.modelRatings).values({ modelId: id, userId: u.id, stars });
      }
      // Recompute average and update in-memory + try to persist derived integer rating (avg*10)
  const all = await db.select().from(schema.modelRatings).where(eq(schema.modelRatings.modelId, id));
  const avg = all.length ? all.reduce((a: number, r: any) => a + (Number(r.stars) || 0), 0) / all.length : 0;
      const ratingInt = Math.max(0, Math.min(50, Math.round(avg * 10)));
      m.rating = ratingInt;
      try { await db.update(schema.models).set({ rating: ratingInt }).where(eq(schema.models.id, id)); } catch {}
      return res.json({ rating: avg, ratingInt, count: all.length });
    } catch (e:any) {
      return res.status(500).json({ error: 'rating_failed', message: e?.message });
    }
  });

  // ===== Moderation =====
  app.post("/api/moderation/report", async (req, res) => {
    const parsed = z.object({ modelId: z.string().min(1), userId: z.string().min(1), reason: z.string().min(1), details: z.string().optional() }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    const { modelId, userId, reason, details } = parsed.data;
    const r = await storage.addReport(modelId, userId, reason, details);
    res.json(r);
  });
  app.post("/api/moderation/block", async (req, res) => {
    const parsed = z.object({ modelId: z.string().min(1), userId: z.string().min(1) }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    await storage.blockUser(parsed.data.modelId, parsed.data.userId);
    // Audit: admin blocks user for model
    try { const actor = String((req as any).user?.uid || (req.headers['x-user-id'] as string) || ''); const role = String((req as any).user?.role || (req.headers['x-role'] as string) || ''); await storage.addAudit({ actor, role, action: 'block', target: `${parsed.data.modelId}:${parsed.data.userId}` }); } catch {}
    res.json({ status: 'blocked' });
  });
  app.post("/api/moderation/unblock", async (req, res) => {
    const parsed = z.object({ modelId: z.string().min(1), userId: z.string().min(1) }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: "invalid_payload", details: parsed.error.flatten() });
    await storage.unblockUser(parsed.data.modelId, parsed.data.userId);
    // Audit: admin unblocks user for model
    try { const actor = String((req as any).user?.uid || (req.headers['x-user-id'] as string) || ''); const role = String((req as any).user?.role || (req.headers['x-role'] as string) || ''); await storage.addAudit({ actor, role, action: 'unblock', target: `${parsed.data.modelId}:${parsed.data.userId}` }); } catch {}
    res.json({ status: 'unblocked' });
  });
  app.get("/api/moderation/blocks", async (req, res) => {
    const modelId = String(req.query.modelId || "");
    if (!modelId) return res.status(400).json({ error: "modelId required" });
    const list = await storage.listBlocks(modelId);
    res.json({ modelId, blocks: list });
  });
  app.get("/api/moderation/reports", requireRole(['admin']), async (_req, res) => {
    res.json(await storage.listReports());
  });

  // ===== Public Chat (per model, with optional moderation stub) =====
  app.get("/api/chat/public", async (req, res) => {
    const limit = Number(req.query.limit || 50);
    const modelId = typeof req.query.modelId === 'string' ? String(req.query.modelId) : undefined;
    res.json(await storage.listPublicMessages(modelId, limit));
  });
  app.post("/api/chat/public", async (req, res) => {
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

  // Favorites API (optional, complements client local favorites)
  app.get('/api/favorites', requireRole(['user','model','admin']), async (req, res) => {
    const u = (req as any).user as ReqUser;
    const list = await storage.getFavorites(u!.id);
    res.json({ favorites: list });
  });
  app.post('/api/favorites/:modelId', requireRole(['user','model','admin']), async (req, res) => {
    const u = (req as any).user as ReqUser;
    const list = await storage.toggleFavorite(u!.id, String(req.params.modelId));
    res.json({ favorites: list });
  });

  // Convenience: allow starting a private show by username (useful from recent public chat list)
  app.post('/api/sessions/start-by-username', async (req, res) => {
    const parsed = z.object({ username: z.string().min(1), modelId: z.string().min(1) }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const user = await storage.getUserByUsername(String(parsed.data.username));
    if (!user) return res.status(404).json({ error: 'user not found' });
    const s = await storage.startSession(user.id, String(parsed.data.modelId));
    res.json(s);
  });

  // ===== INTEGRAZIONE SIRPLAY (Operatore B) =====

  // 1) Registrazione utente da Sirplay -> Operatore (B)
  app.post("/api/user/register", async (req, res) => {
    const parsed = z.object({ externalUserId: z.string().min(1), email: z.string().email().optional(), name: z.string().optional() }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const { externalUserId, email, name } = parsed.data;
    const user = await storage.createUser({ username: name || `user_${externalUserId}`, email, externalUserId });
    return res.json({ userId: user.id, externalUserId, status: "CREATED" });
  });

  // 2) Info player lato Operatore B
  app.get("/api/v1/player/info", async (req, res) => {
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

  // 3) SSO: Sirplay chiede token per userId_B
  app.post("/api/sso/token", async (req, res) => {
    const parsed = z.object({ userId_B: z.string().min(1) }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const token = jwt.sign({ uid: parsed.data.userId_B }, getJWTSecret(), { expiresIn: "10m" });
    res.json({ token, expiresIn: 600 });
  });

  // util per validare token (B)
  app.get("/api/sso/validate", async (req, res) => {
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
  app.get("/api/wallet/balance", async (req, res) => {
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

  app.post("/api/wallet/deposit", async (req, res) => {
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

  app.post("/api/wallet/withdrawal", async (req, res) => {
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
  app.get("/api/operator/transactions", requireRole(['admin']), async (req, res) => {
    const limit = Number(req.query.limit || 100);
    const list = await storage.listTransactions(limit);
    res.json(list);
  });
  app.get("/api/operator/sessions", requireRole(['admin']), async (req, res) => {
    const userId_B = req.query.userId_B ? String(req.query.userId_B) : undefined;
    const modelId = req.query.modelId ? String(req.query.modelId) : undefined;
    const limit = Number(req.query.limit || 100);
    const list = await storage.listSessions({ userId_B, modelId, limit });
    res.json(list);
  });

  // Demo login endpoint issuing JWT for seeded users
  app.post('/api/auth/login', async (req, res) => {
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

  // Registration endpoint capturing personal data and initializing wallet/card in DB
  app.post('/api/auth/register', async (req, res) => {
    if (!db) return res.status(500).json({ error: 'db_unavailable' });
    const parsed = z.object({
      username: z.string().min(3),
      email: z.string().email().optional(),
      password: z.string().min(6),
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      dateOfBirth: z.string().optional(),
      cardBrand: z.string().optional(),
      cardLast4: z.string().max(4).optional(),
      expMonth: z.union([z.string(), z.number()]).optional(),
      expYear: z.union([z.string(), z.number()]).optional(),
    }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const { username, email, password, firstName, lastName, dateOfBirth, cardBrand, cardLast4, expMonth, expYear } = parsed.data;
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
      await db.insert(schema.users).values({ id, username, password, email, role: 'user' });
      // Profile
      await db.insert(schema.userProfiles).values({ userId: id, firstName, lastName, birthDate: dateOfBirth ? new Date(dateOfBirth) as any : undefined });
      // Wallet (0 balance)
      await db.insert(schema.wallets).values({ userId: id, balanceCents: 0, currency: 'EUR' });
      // Card (metadata only)
      if (cardLast4 || cardBrand) {
        await db.insert(schema.cards).values({ id: crypto.randomUUID(), userId: id, brand: cardBrand, last4: cardLast4, expMonth: expMonth ? Number(expMonth) : null as any, expYear: expYear ? Number(expYear) : null as any });
      }
      const token = jwt.sign({ uid: id, role: 'user', username }, getJWTSecret(), { expiresIn: '1d' });
      return res.json({ token, user: { id, username, role: 'user', email } });
    } catch (e:any) {
      return res.status(500).json({ error: 'registration_failed', message: e?.message });
    }
  });

  // Healthcheck
  app.get("/api/healthz", (_req, res) => res.json({ ok: true }));

  // Admin: audit log
  app.get('/api/operator/audit', requireRole(['admin']), async (req, res) => {
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
  app.get('/api/operator/audit/export', requireRole(['admin']), async (req, res) => {
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
  app.post('/api/dmca/report', async (req, res) => {
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
  app.get('/api/operator/dmca', requireRole(['admin']), async (req, res) => {
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
  app.get('/api/operator/dmca/export', requireRole(['admin']), async (req, res) => {
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
  app.patch('/api/operator/dmca/:id/status', requireRole(['admin']), async (req, res) => {
    const parsed = z.object({ status: z.enum(['open','closed','rejected']), notes: z.string().optional() }).safeParse(req.body ?? {});
    if (!parsed.success) return res.status(400).json({ error: 'invalid_payload', details: parsed.error.flatten() });
    const n = await storage.updateDmcaStatus(String(req.params.id), parsed.data.status, parsed.data.notes);
    if (!n) return res.status(404).json({ error: 'not_found' });
    try { if (db) { await db.update(schema.dmcaNotices).set({ status: n.status, notes: n.notes }).where(eq(schema.dmcaNotices.id, n.id)); } } catch {}
    res.json(n);
  });

  // ===== KYC =====
  app.post('/api/kyc/apply', async (req, res) => {
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
  app.get('/api/operator/kyc', requireRole(['admin']), async (req, res) => {
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
  app.get('/api/operator/kyc/export', requireRole(['admin']), async (req, res) => {
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
  app.patch('/api/operator/kyc/:id/status', requireRole(['admin']), async (req, res) => {
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
  app.post('/api/kyc/:applicationId/upload', kycUpload.single('file'), async (req: any, res) => {
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
  app.get("/api/version", (_req, res) => res.json({ version: appVersion, time: new Date().toISOString() }));

  // RTC client config: expose ICE servers to browser
  app.get('/api/rtc/config', (_req, res) => {
    const iceServers: any[] = [];
    // Always include a public STUN fallback
    iceServers.push({ urls: ['stun:stun.l.google.com:19302'] });
    if (process.env.TURN_URL && process.env.TURN_USER && process.env.TURN_PASS) {
      iceServers.push({ urls: [String(process.env.TURN_URL)], username: process.env.TURN_USER, credential: process.env.TURN_PASS });
    }
    res.json({ iceServers });
  });

  // Lightweight image proxy to bypass third-party CORP/CSP issues for remote thumbnails
  app.get('/api/proxy/img', async (req, res) => {
    try {
      const raw = String(req.query.u || req.query.url || '');
      if (!raw) return res.status(400).json({ error: 'missing_url' });
      let target: URL;
      try { target = new URL(raw); } catch { return res.status(400).json({ error: 'invalid_url' }); }
      if (target.protocol !== 'https:') return res.status(400).json({ error: 'https_only' });
      // Optional: tighten allowlist to common CDNs
      const allowedHosts = new Set<string>([
        'images.unsplash.com',
        'plus.unsplash.com',
        'images.pexels.com',
        'cdn.pixabay.com',
      ]);
      if (!allowedHosts.has(target.hostname)) {
        // fallback: allow any https but cap size and set short cache
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
  app.get('/api/selftest/images', async (_req, res) => {
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
  app.post("/api/webhooks/sirplay", async (req: any, res) => {
    const secret = process.env.SIRPLAY_WEBHOOK_SECRET || "";
    if (!secret) return res.status(500).json({ error: "missing webhook secret" });
    const sigHeaderName = (process.env.SIRPLAY_WEBHOOK_SIGNATURE_HEADER || 'x-sirplay-signature').toLowerCase();
    const tsHeaderName = (process.env.SIRPLAY_WEBHOOK_TIMESTAMP_HEADER || 'x-sirplay-timestamp').toLowerCase();
    const providedSig = String(req.headers[sigHeaderName] || "");
    const timestamp = String(req.headers[tsHeaderName] || "");

    try {
      // Optional: refuse if timestamp too old (> 5 mins)
      if (timestamp) {
        const age = Math.abs(Date.now() - Number(timestamp));
        if (Number.isFinite(age) && age > 5 * 60 * 1000) {
          return res.status(401).json({ error: 'stale webhook' });
        }
      }
      // Compute HMAC over raw body (and timestamp if required by provider)
      const raw = req.rawBody as Buffer;
      const base = timestamp ? (timestamp + '.' + raw.toString('utf8')) : raw.toString('utf8');
      const hmac = crypto.createHmac('sha256', secret).update(base).digest('hex');
      if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(providedSig))) {
        return res.status(401).json({ error: 'invalid signature' });
      }
    } catch (e:any) {
      return res.status(401).json({ error: 'verification failed' });
    }

    // At this point the payload is trusted. Parse JSON from req.body
    const event = req.body || {};
    // Example: process deposit/cashout notifications
    // Expecting shape: { type: 'deposit'|'withdrawal', userId_A?: string, userId_B?: string, amount: number, ref?: string }
    try {
      // Idempotency: skip if ref was already processed
      if (await storage.isRefProcessed(event?.ref)) {
        return res.json({ ok: true, idempotent: true });
      }
      if (event?.type === 'deposit' && typeof event.amount === 'number') {
        if (event.userId_A) {
          await storage.deposit(event.userId_A, event.amount);
          const tx = await storage.addTransaction({ userId_A: event.userId_A, type: 'DEPOSIT', amount: event.amount, source: 'sirplay_webhook', externalRef: event.ref });
          try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_A: event.userId_A, type: 'DEPOSIT', amountCents: Math.round(event.amount * 100), currency: 'EUR', source: 'sirplay_webhook', externalRef: event.ref }); } } catch {}
        } else if (event.userId_B) {
          await storage.localDeposit(event.userId_B, event.amount);
          const tx = await storage.addTransaction({ userId_B: event.userId_B, type: 'DEPOSIT', amount: event.amount, source: 'sirplay_webhook', externalRef: event.ref });
          try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_B: event.userId_B, type: 'DEPOSIT', amountCents: Math.round(event.amount * 100), currency: 'EUR', source: 'sirplay_webhook', externalRef: event.ref }); } } catch {}
        }
      }
      if (event?.type === 'withdrawal' && typeof event.amount === 'number') {
        if (event.userId_A) {
          await storage.withdraw(event.userId_A, event.amount);
          const tx = await storage.addTransaction({ userId_A: event.userId_A, type: 'WITHDRAWAL', amount: event.amount, source: 'sirplay_webhook', externalRef: event.ref });
          try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_A: event.userId_A, type: 'WITHDRAWAL', amountCents: Math.round(event.amount * 100), currency: 'EUR', source: 'sirplay_webhook', externalRef: event.ref }); } } catch {}
        } else if (event.userId_B) {
          try {
            await storage.localWithdraw(event.userId_B, event.amount);
            const tx = await storage.addTransaction({ userId_B: event.userId_B, type: 'WITHDRAWAL', amount: event.amount, source: 'sirplay_webhook', externalRef: event.ref });
            try { if (db) { await db.insert(schema.transactions).values({ id: tx.id, userId_B: event.userId_B, type: 'WITHDRAWAL', amountCents: Math.round(event.amount * 100), currency: 'EUR', source: 'sirplay_webhook', externalRef: event.ref }); } } catch {}
          } catch {}
        }
      }
      await storage.markRefProcessed(event?.ref);
    } catch (e:any) {
      return res.status(500).json({ error: 'processing_failed' });
    }

    return res.json({ ok: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}
