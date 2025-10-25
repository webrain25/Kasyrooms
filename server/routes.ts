
import type { Express } from "express";
import { createServer } from "http";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function registerRoutes(app: Express, opts?: { version?: string }) {
  const appVersion = opts?.version || "dev";
  // Simple auth extraction: prefer JWT; fallback to dev headers x-user-id/x-role
  type ReqUser = { id: string; role: 'user'|'model'|'admin'; username?: string } | null;
  function getReqUser(req: any): ReqUser {
    const auth = req.headers['authorization'];
    if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
      const token = auth.slice('Bearer '.length);
      try {
        const payload = jwt.verify(token, JWT_SECRET) as any;
        return { id: String(payload.uid), role: payload.role as any, username: payload.username };
      } catch {}
    }
    const role = (req.headers['x-role'] || req.headers['x-user-role']) as string | undefined;
    const uid = (req.headers['x-user-id'] || req.headers['x-uid']) as string | undefined;
    if (role && uid) return { id: String(uid), role: role as any };
    return null;
  }

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
    const filters: any = {};
    if (req.query.online === "true") filters.isOnline = true;
    if (req.query.new === "true") filters.isNew = true;
    if (req.query.sortBy === "rating" || req.query.sortBy === "viewers") filters.sortBy = req.query.sortBy;
    if (req.query.search) filters.search = req.query.search as string;
    res.json(await storage.listModels(filters));
  });

  // Home grouping endpoint: favorites vs others, grouped by status
  // Supports server-side favorites (from auth user) or client-provided favorites via ?favs=id1,id2
  app.get("/api/models/home", async (req, res) => {
    const u = getReqUser(req);
    const favsOverride = typeof req.query.favs === 'string' && (req.query.favs as string).trim().length > 0
      ? (req.query.favs as string).split(',').map(s=>s.trim()).filter(Boolean)
      : undefined;
    const result = await storage.listModelsHome({ userId: u?.id, favoritesOverride: favsOverride });
    res.json(result);
  });

  // Online models count (used by filters bar)
  app.get("/api/stats/online-count", async (_req, res) => {
    const list = await storage.listModels({ isOnline: true });
    res.json({ count: list.length });
  });

  app.get("/api/models/:id", async (req, res) => {
    const m = await storage.getModel(req.params.id);
    if (!m) return res.status(404).json({ error: "Model not found" });
    res.json(m);
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
    const { userId_B, modelId } = req.body ?? {};
    if (!userId_B || !modelId) return res.status(400).json({ error: "userId_B and modelId required" });
    const s = await storage.startSession(userId_B, modelId);
    res.json(s);
  });
  app.post("/api/sessions/:id/end", async (req, res) => {
    const { durationSec, totalCharged } = req.body ?? {};
    const s = await storage.endSession(req.params.id, { durationSec, totalCharged });
    if (!s) return res.status(404).json({ error: "session not found" });
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

  // Update model profile (simple patch)
  app.patch("/api/models/:id", requireModelSelfOrAdmin(), async (req, res) => {
    const m = await storage.updateModelProfile(req.params.id, req.body ?? {});
    if (!m) return res.status(404).json({ error: "Model not found" });
    res.json(m);
  });
  // Model photos
  app.post("/api/models/:id/photos", requireModelSelfOrAdmin(), async (req, res) => {
    const { url } = req.body ?? {};
    if (!url) return res.status(400).json({ error: "url required" });
    const photos = await storage.addModelPhoto(req.params.id, url);
    if (!photos) return res.status(404).json({ error: "Model not found" });
    res.json({ photos });
  });
  app.get("/api/models/:id/photos", async (req, res) => {
    const photos = await storage.listModelPhotos(req.params.id);
    res.json({ photos });
  });

  // Aliases per spec (model account)
  app.post('/api/models/update-status', requireRole(['model','admin']), async (req, res) => {
    const { model_id, status, visible } = req.body ?? {};
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
    const { url } = req.body ?? {};
    if (!url) return res.status(400).json({ error: 'url required' });
    const photos = await storage.addModelPhoto(u.id, url);
    if (!photos) return res.status(404).json({ error: 'Model not found' });
    res.json({ photos });
  });
  app.get('/api/models/gallery', requireRole(['model','admin']), async (req, res) => {
    const u = getReqUser(req);
    if (!u) return res.status(403).json({ error: 'forbidden' });
    const photos = await storage.listModelPhotos(u.id);
    res.json({ photos });
  });

  // ===== Moderation =====
  app.post("/api/moderation/report", async (req, res) => {
    const { modelId, userId, reason, details } = req.body ?? {};
    if (!modelId || !userId || !reason) return res.status(400).json({ error: "modelId, userId, reason required" });
    const r = await storage.addReport(modelId, userId, reason, details);
    res.json(r);
  });
  app.post("/api/moderation/block", async (req, res) => {
    const { modelId, userId } = req.body ?? {};
    if (!modelId || !userId) return res.status(400).json({ error: "modelId, userId required" });
    await storage.blockUser(modelId, userId);
    res.json({ status: 'blocked' });
  });
  app.post("/api/moderation/unblock", async (req, res) => {
    const { modelId, userId } = req.body ?? {};
    if (!modelId || !userId) return res.status(400).json({ error: "modelId, userId required" });
    await storage.unblockUser(modelId, userId);
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
    const { user, text, userId_B, modelId } = req.body ?? {};
    if (!user || !text) return res.status(400).json({ error: "user and text required" });
    // Simple moderation stub: block if contains banned word
    const messageText = String(text);
    const banned = [/\b(offensive|hate|slur)\b/i];
    if (banned.some(rx => rx.test(messageText))) {
      return res.status(403).json({ error: 'message_blocked', reason: 'offensive_content' });
    }
    res.json(await storage.postPublicMessage(modelId, user, messageText, userId_B));
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
    const { username, modelId } = req.body ?? {};
    if (!username || !modelId) return res.status(400).json({ error: 'username and modelId required' });
    const user = await storage.getUserByUsername(String(username));
    if (!user) return res.status(404).json({ error: 'user not found' });
    const s = await storage.startSession(user.id, String(modelId));
    res.json(s);
  });

  // ===== INTEGRAZIONE SIRPLAY (Operatore B) =====

  // 1) Registrazione utente da Sirplay -> Operatore (B)
  app.post("/api/user/register", async (req, res) => {
    const { externalUserId, email, name } = req.body ?? {};
    if (!externalUserId) return res.status(400).json({ error: "externalUserId required" });
    // create local user with mapping to A
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
    const { userId_B } = req.body ?? {};
    if (!userId_B) return res.status(400).json({ error: "userId_B required" });
    const token = jwt.sign({ uid: userId_B }, JWT_SECRET, { expiresIn: "10m" });
    res.json({ token, expiresIn: 600 });
  });

  // util per validare token (B)
  app.get("/api/sso/validate", async (req, res) => {
    const token = String(req.query.token || "");
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
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
    const { userId_A, userId, amount, transactionId, source } = req.body ?? {};
    if (typeof amount !== 'number') return res.status(400).json({ error: "numeric amount required" });
    if (!userId_A && !userId) return res.status(400).json({ error: 'userId or userId_A required' });
    try {
      if (userId_A) {
        const newBalance = await storage.deposit(userId_A, amount);
        await storage.addTransaction({ userId_A, type: 'DEPOSIT', amount, source, externalRef: transactionId });
        return res.json({ userId_A, newBalance, transactionId, status: "SUCCESS", source, mode: 'shared' });
      }
      const u = await storage.getUser(String(userId));
      if (!u) return res.status(404).json({ error: 'user not found' });
      if (u.externalUserId) {
        const newBalance = await storage.deposit(u.externalUserId, amount);
        await storage.addTransaction({ userId_A: u.externalUserId, type: 'DEPOSIT', amount, source, externalRef: transactionId });
        return res.json({ userId_A: u.externalUserId, newBalance, transactionId, status: "SUCCESS", source, mode: 'shared' });
      }
      const newBalance = await storage.localDeposit(u.id, amount);
      await storage.addTransaction({ userId_B: u.id, type: 'DEPOSIT', amount, source, externalRef: transactionId });
      return res.json({ userId: u.id, newBalance, transactionId, status: "SUCCESS", source, mode: 'local' });
    } catch (e:any) {
      return res.status(500).json({ error: e?.message || 'DEPOSIT_ERROR' });
    }
  });

  app.post("/api/wallet/withdrawal", async (req, res) => {
    const { userId_A, userId, amount, transactionId, source } = req.body ?? {};
    if (typeof amount !== 'number') return res.status(400).json({ error: "numeric amount required" });
    if (!userId_A && !userId) return res.status(400).json({ error: 'userId or userId_A required' });
    try {
      if (userId_A) {
        const newBalance = await storage.withdraw(userId_A, amount);
        await storage.addTransaction({ userId_A, type: 'WITHDRAWAL', amount, source, externalRef: transactionId });
        return res.json({ userId_A, newBalance, transactionId, status: "SUCCESS", source, mode: 'shared' });
      }
      const u = await storage.getUser(String(userId));
      if (!u) return res.status(404).json({ error: 'user not found' });
      if (u.externalUserId) {
        const newBalance = await storage.withdraw(u.externalUserId, amount);
        await storage.addTransaction({ userId_A: u.externalUserId, type: 'WITHDRAWAL', amount, source, externalRef: transactionId });
        return res.json({ userId_A: u.externalUserId, newBalance, transactionId, status: "SUCCESS", source, mode: 'shared' });
      }
      try {
        const newBalance = await storage.localWithdraw(u.id, amount);
        await storage.addTransaction({ userId_B: u.id, type: 'WITHDRAWAL', amount, source, externalRef: transactionId });
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
    const { username } = req.body ?? {};
    const map: Record<string, { id: string; role: 'user'|'model'|'admin' }> = {
      utente: { id: 'u-001', role: 'user' },
      modella: { id: 'm-001', role: 'model' },
      admin: { id: 'a-001', role: 'admin' },
    };
    const found = map[String(username).toLowerCase() as keyof typeof map];
    if (!found) return res.status(401).json({ error: 'invalid credentials' });
    const token = jwt.sign({ uid: found.id, role: found.role, username }, JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token, user: { id: found.id, username, role: found.role } });
  });

  // Healthcheck
  app.get("/api/healthz", (_req, res) => res.json({ ok: true }));

  // Simple version endpoint to verify deployed build
  app.get("/api/version", (_req, res) => res.json({ version: appVersion, time: new Date().toISOString() }));

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
      if (event?.type === 'deposit' && typeof event.amount === 'number') {
        if (event.userId_A) {
          await storage.deposit(event.userId_A, event.amount);
          await storage.addTransaction({ userId_A: event.userId_A, type: 'DEPOSIT', amount: event.amount, source: 'sirplay_webhook', externalRef: event.ref });
        } else if (event.userId_B) {
          await storage.localDeposit(event.userId_B, event.amount);
          await storage.addTransaction({ userId_B: event.userId_B, type: 'DEPOSIT', amount: event.amount, source: 'sirplay_webhook', externalRef: event.ref });
        }
      }
      if (event?.type === 'withdrawal' && typeof event.amount === 'number') {
        if (event.userId_A) {
          await storage.withdraw(event.userId_A, event.amount);
          await storage.addTransaction({ userId_A: event.userId_A, type: 'WITHDRAWAL', amount: event.amount, source: 'sirplay_webhook', externalRef: event.ref });
        } else if (event.userId_B) {
          try {
            await storage.localWithdraw(event.userId_B, event.amount);
            await storage.addTransaction({ userId_B: event.userId_B, type: 'WITHDRAWAL', amount: event.amount, source: 'sirplay_webhook', externalRef: event.ref });
          } catch {}
        }
      }
    } catch (e:any) {
      return res.status(500).json({ error: 'processing_failed' });
    }

    return res.json({ ok: true });
  });

  const httpServer = createServer(app);

  // TEMP: diagnostics to list registered routes and their order (for prod verification)
  app.get('/api/_routes', (_req: any, res: any) => {
    try {
      const stack: any[] = (app as any)?._router?.stack || [];
      const routes = stack
        .filter((l: any) => l.route && l.route.path)
        .map((l: any) => ({
          path: l.route.path,
          methods: Object.keys(l.route.methods || {}),
        }));
      res.json({ count: routes.length, routes });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || 'diag_failed' });
    }
  });
  return httpServer;
}
