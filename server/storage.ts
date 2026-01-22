
import { randomUUID } from "crypto";
import { db, schema } from "./db.js";

export type User = {
  id: string;           // local B id
  username: string;
  email?: string;
  externalUserId?: string; // A id
  sirplayUserId?: string;  // Sirplay userId
  sirplayCustomerId?: string; // Sirplay customerId
  role: 'user' | 'model' | 'admin';
  createdAt: string;
};

export type Model = {
  id: number;
  name: string;
  age: number;
  country: string;
  languages: string[];
  specialties: string[];
  isOnline: boolean;
  isBusy: boolean;
  isNew: boolean;
  rating: number;        // 0..50
  viewerCount: number;
  profileImage: string;
  photos?: string[];
  privateShows?: number;
  hoursOnline?: number;
  createdAt: string;
  visible?: boolean;
};

export type Report = { id: string; modelId: number; userId: string; reason: string; details?: string; createdAt: string };

// DMCA and KYC types
export type DmcaNotice = {
  id: string;
  reporterName: string;
  reporterEmail: string;
  originalContentUrl: string;
  infringingUrls: string[];
  signature: string; // attestation of truth
  createdAt: string;
  status: 'open'|'closed'|'rejected';
  notes?: string;
};

export type KycApplication = {
  id: string;
  userId?: string;
  fullName: string;
  dateOfBirth?: string;
  country?: string;
  documentType?: 'passport'|'id_card'|'driver_license';
  documentFrontUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  createdAt: string;
  status: 'pending'|'approved'|'rejected';
  notes?: string;
};

export class MemStorage {
  users = new Map<string, User>();
  models = new Map<number, Model>();
  modelAliases = new Map<string, number>(); // e.g. userId 'm-001' -> numeric modelId
  balances = new Map<string, number>(); // key: userId_A
  localBalances = new Map<string, number>(); // key: local user id
  // Transaction log and private sessions tracking
  transactions: Array<{ id: string; userId_A?: string; userId_B?: string; type: 'DEPOSIT'|'WITHDRAWAL'|'CHARGE'; amount: number; source?: string; createdAt: string; externalRef?: string }>=[];
  sessions: Array<{ id: string; userId_B: string; modelId: number; startAt: string; endAt?: string; durationSec?: number; totalCharged?: number; lastChargeAt?: string; billedMinutes?: number }> =[];
  blocksByModel = new Map<number, Set<string>>(); // modelId -> set of blocked userIds
  reports: Report[] = [];
  dmcaNotices: DmcaNotice[] = [];
  kycApplications: KycApplication[] = [];
  audit: Array<{ id: string; when: string; actor?: string; role?: string; action: string; target?: string; meta?: any }> = [];
  // Public chat per model (modelKey -> messages). We normalize modelId to numeric when possible.
  publicChatByModel = new Map<string, Array<{ id: string; user: string; text: string; when: string; userId_B?: string }>>();
  // Favorites per user (userId -> set of modelIds)
  favoritesByUser = new Map<string, Set<string>>();
  // Idempotency keys for webhooks (in-memory)
  processedRefs = new Set<string>();
  // Login tokens: opaque one-time tokens mapped to local user id with TTL
  loginTokens = new Map<string, { userId: string; expiresAt: number; consumed?: boolean }>();

  constructor() {
    this.seed();
  // Account di prova
    const testUser = {
      username: "testuser",
      email: "test@example.com",
      externalUserId: "testA"
    };
    this.createUser(testUser);
    // Seed ruoli demo coerenti con il client
    this.users.set('u-001', { id:'u-001', username:'utente', email:'utente@example.com', role:'user', createdAt:new Date().toISOString() });
    this.users.set('m-001', { id:'m-001', username:'modella', email:'modella@example.com', role:'model', createdAt:new Date().toISOString() });
    this.users.set('a-001', { id:'a-001', username:'admin', email:'admin@example.com', role:'admin', createdAt:new Date().toISOString() });
  }

  private parsePositiveInt(v: string): number | undefined {
    if (!/^\d+$/.test(v)) return undefined;
    const n = Number(v);
    if (!Number.isSafeInteger(n) || n <= 0) return undefined;
    return n;
  }

  resolveModelId(input: string | number): number | undefined {
    if (typeof input === 'number') {
      if (!Number.isSafeInteger(input) || input <= 0) return undefined;
      return input;
    }
    const raw = String(input || '').trim();
    if (!raw) return undefined;
    const alias = this.modelAliases.get(raw);
    if (typeof alias === 'number') return alias;
    return this.parsePositiveInt(raw);
  }

  private modelKey(input?: string | number): string {
    if (input === undefined || input === null) return 'global';
    const resolved = this.resolveModelId(input as any);
    return typeof resolved === 'number' ? String(resolved) : String(input);
  }

  private seed() {
    const sample: Omit<Model, "id"|"createdAt">[] = [
      { name:"Sophia", age:24, country:"Italy", languages:["EN","IT"], specialties:["Private shows","role play","lingerie"], isOnline:true, isBusy:false, isNew:false, rating:49, viewerCount:1234, profileImage: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=600&fit=crop&crop=face", privateShows: 102, hoursOnline: 340 },
      { name:"Mila", age:22, country:"Spain", languages:["EN","ES"], specialties:["Cosplay","dance"], isOnline:true, isBusy:true, isNew:true, rating:45, viewerCount:876, profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=600&fit=crop&crop=face", privateShows: 12, hoursOnline: 80 },
      { name:"Aria", age:27, country:"France", languages:["EN","FR"], specialties:["Chat","fetish"], isOnline:true, isBusy:false, isNew:false, rating:46, viewerCount:432, profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=600&fit=crop&crop=face", privateShows: 54, hoursOnline: 210 },
      { name:"Emma", age:25, country:"USA", languages:["EN"], specialties:["Fitness","outdoor"], isOnline:true, isBusy:true, isNew:false, rating:48, viewerCount:567, profileImage: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=600&fit=crop&crop=face", privateShows: 78, hoursOnline: 150 },
      { name:"Luna", age:23, country:"Japan", languages:["EN","JP"], specialties:["Anime","kawaii"], isOnline:true, isBusy:false, isNew:true, rating:47, viewerCount:789, profileImage: "https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=400&h=600&fit=crop&crop=face", privateShows: 22, hoursOnline: 95 },
      { name:"Sofia", age:26, country:"Brazil", languages:["EN","PT"], specialties:["Dance","latin"], isOnline:false, isBusy:false, isNew:false, rating:44, viewerCount:234, profileImage: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=600&fit=crop&crop=face", privateShows: 9, hoursOnline: 30 },
      { name:"Isabella", age:28, country:"Mexico", languages:["EN","ES"], specialties:["Cooking","lifestyle"], isOnline:true, isBusy:false, isNew:false, rating:43, viewerCount:345, profileImage: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&h=600&fit=crop&crop=face", privateShows: 31, hoursOnline: 120 },
      { name:"Chloe", age:21, country:"UK", languages:["EN"], specialties:["Gaming","tech"], isOnline:true, isBusy:false, isNew:true, rating:42, viewerCount:456, profileImage: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=600&fit=crop&crop=face", privateShows: 4, hoursOnline: 20 }
    ];
    let nextId = 1;
    for (const m of sample) {
      const id = nextId++;
      this.models.set(id, { ...m, id, visible: true, createdAt: new Date().toISOString() });
    }

    // Demo model account has user id 'm-001'. Keep client compatibility by aliasing that user id to a numeric model id.
    const demoModelId = nextId++;
    const base = sample[0];
    this.models.set(demoModelId, {
      ...base,
      id: demoModelId,
      name: 'Modella Demo',
      visible: true,
      createdAt: new Date().toISOString()
    });
    this.modelAliases.set('m-001', demoModelId);
  }

  async createUser(u: {username:string; email?:string; externalUserId?:string; role?: User['role'];}): Promise<User> {
    const id = randomUUID();
    const user: User = { id, username: u.username, email: u.email, externalUserId: u.externalUserId, role: u.role || 'user', createdAt: new Date().toISOString() };
    this.users.set(id, user);
    return user;
  }
  async getUser(id: string) { return this.users.get(id); }
  async getUserByExternal(externalId: string) {
    for (const u of this.users.values()) if (u.externalUserId === externalId) return u;
    return undefined;
  }
  async getUserBySirplayUserId(sirplayUserId: string) {
    const key = String(sirplayUserId);
    for (const u of this.users.values()) if (u.sirplayUserId === key) return u;
    return undefined;
  }

  async listModels(filters?: { isOnline?: boolean; isNew?: boolean; sortBy?: 'rating'|'viewers'; search?: string; country?: string; language?: string; specialty?: string }) {
    let arr = Array.from(this.models.values());
    if (filters?.isOnline !== undefined) arr = arr.filter(m=>m.isOnline===filters.isOnline);
    if (filters?.isNew !== undefined) arr = arr.filter(m=>m.isNew===filters.isNew);
    if (filters?.country) {
      const cc = filters.country.toLowerCase();
      arr = arr.filter(m => m.country.toLowerCase() === cc);
    }
    if (filters?.language) {
      const lc = filters.language.toLowerCase();
      arr = arr.filter(m => m.languages.some(l => l.toLowerCase() === lc));
    }
    if (filters?.specialty) {
      const sc = filters.specialty.toLowerCase();
      arr = arr.filter(m => m.specialties.some(s => s.toLowerCase().includes(sc)));
    }
    if (filters?.search) {
      const searchTerm = filters.search.toLowerCase();
      arr = arr.filter(m => 
        m.name.toLowerCase().includes(searchTerm) ||
        m.country.toLowerCase().includes(searchTerm) ||
        m.languages.some(lang => lang.toLowerCase().includes(searchTerm)) ||
        m.specialties.some(spec => spec.toLowerCase().includes(searchTerm))
      );
    }
    // Always prioritize status: online (2) > busy (1) > offline (0)
    const statusScore = (m: Model) => (m.isOnline ? 2 : 0) + (m.isBusy ? 1 : 0);
    arr = arr.sort((a,b)=>{
      const d = statusScore(b) - statusScore(a);
      if (d !== 0) return d;
      if (filters?.sortBy === 'rating') return b.rating - a.rating;
      if (filters?.sortBy === 'viewers') return b.viewerCount - a.viewerCount;
      return 0;
    });
    return arr;
  }
  async getModel(id: string | number) {
    const resolved = this.resolveModelId(id);
    if (typeof resolved !== 'number') return undefined;
    return this.models.get(resolved);
  }
  async setModelOnline(id: string | number, online: boolean) {
    const resolved = this.resolveModelId(id);
    if (typeof resolved !== 'number') return undefined;
    const m = this.models.get(resolved); if(!m) return undefined;
    m.isOnline=online; if(!online) m.isBusy = false; this.models.set(resolved, m); return m;
  }
  async setModelBusy(id: string | number, busy: boolean) {
    const resolved = this.resolveModelId(id);
    if (typeof resolved !== 'number') return undefined;
    const m = this.models.get(resolved); if(!m) return undefined;
    // Only allow busy when online
    m.isBusy = busy && m.isOnline;
    this.models.set(resolved, m);
    return m;
  }

  async updateModelProfile(id: string | number, patch: Partial<Pick<Model, 'name'|'age'|'country'|'languages'|'specialties'|'profileImage'>>) {
    const resolved = this.resolveModelId(id);
    if (typeof resolved !== 'number') return undefined;
    const m = this.models.get(resolved); if (!m) return undefined;
    Object.assign(m, patch);
    this.models.set(resolved, m);
    return m;
  }
  async addModelPhoto(id: string | number, url: string) {
    const resolved = this.resolveModelId(id);
    if (typeof resolved !== 'number') return undefined;
    const m = this.models.get(resolved); if (!m) return undefined;
    if (!m.photos) m.photos = [];
    m.photos.push(url);
    this.models.set(resolved, m);
    return m.photos;
  }
  async listModelPhotos(id: string | number) {
    const resolved = this.resolveModelId(id);
    if (typeof resolved !== 'number') return [];
    const m = this.models.get(resolved); if (!m) return [];
    return m.photos ?? [];
  }

  // moderation
  async blockUser(modelId: string | number, userId: string) {
    const resolved = this.resolveModelId(modelId);
    if (typeof resolved !== 'number') return false;
    const set = this.blocksByModel.get(resolved) ?? new Set<string>();
    set.add(userId);
    this.blocksByModel.set(resolved, set);
    return true;
  }
  async unblockUser(modelId: string | number, userId: string) {
    const resolved = this.resolveModelId(modelId);
    if (typeof resolved !== 'number') return false;
    const set = this.blocksByModel.get(resolved); if (!set) return false;
    set.delete(userId);
    return true;
  }
  async isBlocked(modelId: string | number, userId: string) {
    const resolved = this.resolveModelId(modelId);
    if (typeof resolved !== 'number') return false;
    const set = this.blocksByModel.get(resolved);
    return !!set && set.has(userId);
  }
  async listBlocks(modelId: string | number) {
    const resolved = this.resolveModelId(modelId);
    if (typeof resolved !== 'number') return [];
    return Array.from(this.blocksByModel.get(resolved) ?? []);
  }
  async addReport(modelId: string | number, userId: string, reason: string, details?: string) {
    const resolved = this.resolveModelId(modelId);
    if (typeof resolved !== 'number') throw new Error('INVALID_MODEL_ID');
    const r: Report = { id: randomUUID(), modelId: resolved, userId, reason, details, createdAt: new Date().toISOString() };
    this.reports.unshift(r);
    // Audit trail
    this.audit.unshift({ id: randomUUID(), when: new Date().toISOString(), actor: userId, action: 'report', target: String(resolved), meta: { reason } });
    return r;
  }
  async listReports() { return this.reports; }

  // DMCA helpers
  async addDmcaNotice(data: Omit<DmcaNotice, 'id'|'createdAt'|'status'> & { status?: DmcaNotice['status'] }) {
    const n: DmcaNotice = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: data.status ?? 'open',
      reporterName: data.reporterName,
      reporterEmail: data.reporterEmail,
      originalContentUrl: data.originalContentUrl,
      infringingUrls: data.infringingUrls,
      signature: data.signature,
      notes: data.notes,
    };
    this.dmcaNotices.unshift(n);
    try { await this.addAudit({ action: 'dmca_report', meta: { id: n.id, reporterEmail: n.reporterEmail } }); } catch {}
    return n;
  }
  async listDmcaNotices(status?: DmcaNotice['status']) {
    return typeof status === 'string' ? this.dmcaNotices.filter(n=>n.status===status) : this.dmcaNotices;
  }
  async updateDmcaStatus(id: string, status: DmcaNotice['status'], notes?: string) {
    const n = this.dmcaNotices.find(x => x.id === id);
    if (!n) return undefined;
    n.status = status;
    if (typeof notes === 'string') n.notes = notes;
    try { await this.addAudit({ action: 'dmca_status', target: id, meta: { status } }); } catch {}
    return n;
  }

  // KYC helpers
  async addKycApplication(data: Omit<KycApplication, 'id'|'createdAt'|'status'> & { status?: KycApplication['status'] }) {
    const k: KycApplication = {
      id: randomUUID(),
      createdAt: new Date().toISOString(),
      status: data.status ?? 'pending',
      userId: data.userId,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      country: data.country,
      documentType: data.documentType,
      documentFrontUrl: data.documentFrontUrl,
      documentBackUrl: data.documentBackUrl,
      selfieUrl: data.selfieUrl,
      notes: data.notes,
    };
    this.kycApplications.unshift(k);
    try { await this.addAudit({ actor: data.userId, action: 'kyc_apply', target: k.id }); } catch {}
    return k;
  }
  async listKycApplications(status?: KycApplication['status']) {
    return typeof status === 'string' ? this.kycApplications.filter(a=>a.status===status) : this.kycApplications;
  }
  async updateKycStatus(id: string, status: KycApplication['status'], notes?: string) {
    const a = this.kycApplications.find(x => x.id === id);
    if (!a) return undefined;
    a.status = status;
    if (typeof notes === 'string') a.notes = notes;
    try { await this.addAudit({ action: 'kyc_status', target: id, meta: { status } }); } catch {}
    return a;
  }

  // Update KYC application document URLs (front/back/selfie). Each field is optional.
  async updateKycDocuments(id: string, docs: { documentFrontUrl?: string; documentBackUrl?: string; selfieUrl?: string }) {
    const a = this.kycApplications.find(x => x.id === id);
    if (!a) return undefined;
    let changed = false;
    if (docs.documentFrontUrl) { a.documentFrontUrl = docs.documentFrontUrl; changed = true; }
    if (docs.documentBackUrl) { a.documentBackUrl = docs.documentBackUrl; changed = true; }
    if (docs.selfieUrl) { a.selfieUrl = docs.selfieUrl; changed = true; }
    if (changed) {
      try { await this.addAudit({ action: 'kyc_docs_update', target: id, meta: { front: !!docs.documentFrontUrl, back: !!docs.documentBackUrl, selfie: !!docs.selfieUrl } }); } catch {}
    }
    return a;
  }

  async addAudit(ev: { actor?: string; role?: string; action: string; target?: string; meta?: any }) {
    const entry = { id: randomUUID(), when: new Date().toISOString(), ...ev };
    this.audit.unshift(entry);
    if (this.audit.length > 2000) this.audit.pop();
    // Persist best-effort
    try {
      if (db) {
        await db.insert(schema.auditEvents).values({
          id: entry.id,
          when: new Date(entry.when) as any,
          actor: entry.actor,
          role: entry.role,
          action: entry.action,
          target: entry.target,
          meta: entry.meta ? JSON.stringify(entry.meta) : null as any,
        });
      }
    } catch {}
  }
  async listAudit(limit = 200) { return this.audit.slice(0, limit); }

  // Login token helpers
  async createLoginToken(userId: string, ttlSeconds = 600) {
    const token = randomUUID().replace(/-/g, '') + Math.random().toString(36).slice(2, 10);
    const expiresAt = Date.now() + Math.max(60, ttlSeconds) * 1000;
    this.loginTokens.set(token, { userId, expiresAt, consumed: false });
    return token;
  }
  async getLoginToken(token: string) {
    const info = this.loginTokens.get(token);
    return info;
  }
  async consumeLoginToken(token: string) {
    const info = this.loginTokens.get(token);
    if (!info) return { ok: false, error: 'not_found' as const };
    if (info.consumed) return { ok: false, error: 'already_consumed' as const };
    if (Date.now() > info.expiresAt) { this.loginTokens.delete(token); return { ok: false, error: 'expired' as const }; }
    info.consumed = true;
    this.loginTokens.set(token, info);
    return { ok: true, userId: info.userId };
  }

  // public chat (simple in-memory, global)
  // public chat (per-model)
  async postPublicMessage(modelId: string | number | undefined, user: string, text: string, userId_B?: string) {
    const mId = this.modelKey(modelId);
    const list = this.publicChatByModel.get(mId) || [];
    const msg = { id: randomUUID(), user, text, when: new Date().toISOString(), userId_B };
    list.unshift(msg);
    if (list.length > 200) list.pop();
    this.publicChatByModel.set(mId, list);
    return msg;
  }
  async listPublicMessages(modelId?: string | number, limit = 50) {
    const mId = this.modelKey(modelId);
    const list = this.publicChatByModel.get(mId) || [];
    return list.slice(0, limit);
  }

  // transaction log
  async addTransaction(t: { userId_A?: string; userId_B?: string; type: 'DEPOSIT'|'WITHDRAWAL'|'CHARGE'; amount: number; source?: string; externalRef?: string }) {
    const tx = { id: randomUUID(), createdAt: new Date().toISOString(), ...t };
    this.transactions.unshift(tx);
    if (this.transactions.length > 1000) this.transactions.pop();
    return tx;
  }
  async listTransactions(limit = 100) { return this.transactions.slice(0, limit); }

  // webhook idempotency helpers
  async isRefProcessed(ref?: string) { return !!(ref && this.processedRefs.has(ref)); }
  async markRefProcessed(ref?: string) { if (ref) this.processedRefs.add(ref); }

  // private session tracking
  async startSession(userId_B: string, modelId: string | number) {
    const resolved = this.resolveModelId(modelId);
    if (typeof resolved !== 'number') throw new Error('INVALID_MODEL_ID');
    const now = new Date().toISOString();
    const s = { id: randomUUID(), userId_B, modelId: resolved, startAt: now, lastChargeAt: now, billedMinutes: 0, totalCharged: 0 };
    this.sessions.unshift(s);
    return s;
  }
  async endSession(sessionId: string, fields: { durationSec?: number; totalCharged?: number }) {
    const s = this.sessions.find(x => x.id === sessionId);
    if (!s) return null;
    s.endAt = new Date().toISOString();
    if (typeof fields.durationSec === 'number') s.durationSec = fields.durationSec;
    if (typeof fields.totalCharged === 'number') s.totalCharged = fields.totalCharged;
    return s;
  }
  async listSessions(filter?: { userId_B?: string; modelId?: string | number; limit?: number }) {
    let arr = this.sessions;
    if (filter?.userId_B) arr = arr.filter(s => s.userId_B === filter.userId_B);
    if (filter?.modelId !== undefined) {
      const resolved = this.resolveModelId(filter.modelId);
      if (typeof resolved === 'number') arr = arr.filter(s => s.modelId === resolved);
    }
    const lim = filter?.limit ?? 100;
    return arr.slice(0, lim);
  }

  // local wallet
  async getLocalBalance(userId: string) { return this.localBalances.get(userId) ?? 0; }
  async localDeposit(userId: string, amount: number) {
    const bal = (this.localBalances.get(userId) ?? 0) + amount;
    this.localBalances.set(userId, bal);
    return bal;
  }
  async localWithdraw(userId: string, amount: number) {
    const bal = (this.localBalances.get(userId) ?? 0) - amount;
    if (bal < 0) throw new Error('INSUFFICIENT_FUNDS');
    this.localBalances.set(userId, bal);
    return bal;
  }

  // wallet
  async getBalance(userId_A: string) { return this.balances.get(userId_A) ?? 0; }
  async deposit(userId_A: string, amount: number) {
    const bal = (this.balances.get(userId_A) ?? 0) + amount;
    this.balances.set(userId_A, bal);
    return bal;
  }
  async withdraw(userId_A: string, amount: number) {
    const bal = (this.balances.get(userId_A) ?? 0) - amount;
    this.balances.set(userId_A, bal);
    return bal;
  }

  // helpers
  async updateUserById(id: string, patch: Partial<User>) {
    const u = this.users.get(id);
    if (!u) return undefined;
    const next: User = { ...u, ...patch } as User;
    this.users.set(id, next);
    return next;
  }
  async getUserByUsername(username: string) {
    const target = username.toLowerCase();
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === target) return u;
    }
    return undefined;
  }

  // favorites helpers
  async getFavorites(userId: string) {
    const set = this.favoritesByUser.get(userId);
    return set ? Array.from(set) : [];
  }
  async toggleFavorite(userId: string, modelId: string) {
    const uid = String(userId);
    const mid = String(modelId);
    let set = this.favoritesByUser.get(uid);
    if (!set) { set = new Set<string>(); this.favoritesByUser.set(uid, set); }
    if (set.has(mid)) set.delete(mid); else set.add(mid);
    return Array.from(set);
  }
  async setVisible(modelId: string | number, visible: boolean) {
    const resolved = this.resolveModelId(modelId);
    if (typeof resolved !== 'number') return undefined;
    const m = this.models.get(resolved);
    if (!m) return undefined;
    m.visible = !!visible;
    this.models.set(resolved, m);
    return m;
  }
  async listModelsHome(opts: { userId?: string; favoritesOverride?: string[] }) {
    const all = Array.from(this.models.values());
    const favIds = new Set((opts.favoritesOverride && opts.favoritesOverride.length>0)
      ? opts.favoritesOverride.map(String)
      : (opts.userId ? await this.getFavorites(opts.userId) : []));
    const make = (models: Model[]) => ({
      online: models.filter(m => m.isOnline && !m.isBusy).map(m => ({ id: m.id, photo_url: m.profileImage, status: 'online' })),
      busy: models.filter(m => m.isBusy).map(m => ({ id: m.id, photo_url: m.profileImage, status: 'busy' })),
      offline: models.filter(m => !m.isOnline && !m.isBusy).map(m => ({ id: m.id, photo_url: m.profileImage, status: 'offline' })),
    });
    const favModels = all.filter(m => favIds.has(String(m.id)));
    const otherModels = all.filter(m => !favIds.has(String(m.id)));
    return {
      favorites: make(favModels),
      others: make(otherModels)
    };
  }
}

export const storage = new MemStorage();
