
import { randomUUID } from "crypto";

export type User = {
  id: string;           // local B id
  username: string;
  email?: string;
  externalUserId?: string; // A id
  role: 'user' | 'model' | 'admin';
  createdAt: string;
};

export type Model = {
  id: string;
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
};

export type Report = { id: string; modelId: string; userId: string; reason: string; details?: string; createdAt: string };

export class MemStorage {
  users = new Map<string, User>();
  models = new Map<string, Model>();
  balances = new Map<string, number>(); // key: userId_A
  localBalances = new Map<string, number>(); // key: local user id
  // Transaction log and private sessions tracking
  transactions: Array<{ id: string; userId_A?: string; userId_B?: string; type: 'DEPOSIT'|'WITHDRAWAL'; amount: number; source?: string; createdAt: string; externalRef?: string }>=[];
  sessions: Array<{ id: string; userId_B: string; modelId: string; startAt: string; endAt?: string; durationSec?: number; totalCharged?: number }>=[];
  blocksByModel = new Map<string, Set<string>>(); // modelId -> set of blocked userIds
  reports: Report[] = [];
  publicChat: Array<{ id: string; user: string; text: string; when: string; userId_B?: string }> = [];

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
    for (const m of sample) {
      const id = randomUUID();
      this.models.set(id, { ...m, id, createdAt: new Date().toISOString() });
    }

    // Ensure a demo model bound to the demo 'modella' user exists with a stable id 'm-001'.
    // This allows the demo model account (id 'm-001') to update its own profile/photos via guards.
    if (!this.models.has('m-001')) {
      const base = sample[0];
      this.models.set('m-001', {
        ...base,
        id: 'm-001',
        name: 'Modella Demo',
        createdAt: new Date().toISOString()
      });
    }
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

  async listModels(filters?: { isOnline?: boolean; isNew?: boolean; sortBy?: 'rating'|'viewers'; search?: string }) {
    let arr = Array.from(this.models.values());
    if (filters?.isOnline !== undefined) arr = arr.filter(m=>m.isOnline===filters.isOnline);
    if (filters?.isNew !== undefined) arr = arr.filter(m=>m.isNew===filters.isNew);
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
  async getModel(id: string) { return this.models.get(id); }
  async setModelOnline(id:string, online:boolean) {
    const m=this.models.get(id); if(!m) return undefined;
    m.isOnline=online; if(!online) m.isBusy = false; this.models.set(id,m); return m;
  }
  async setModelBusy(id:string, busy:boolean) {
    const m=this.models.get(id); if(!m) return undefined;
    // Only allow busy when online
    m.isBusy = busy && m.isOnline;
    this.models.set(id,m);
    return m;
  }

  async updateModelProfile(id: string, patch: Partial<Pick<Model, 'name'|'age'|'country'|'languages'|'specialties'|'profileImage'>>) {
    const m = this.models.get(id); if (!m) return undefined;
    Object.assign(m, patch);
    this.models.set(id, m);
    return m;
  }
  async addModelPhoto(id: string, url: string) {
    const m = this.models.get(id); if (!m) return undefined;
    if (!m.photos) m.photos = [];
    m.photos.push(url);
    this.models.set(id, m);
    return m.photos;
  }
  async listModelPhotos(id: string) {
    const m = this.models.get(id); if (!m) return [];
    return m.photos ?? [];
  }

  // moderation
  async blockUser(modelId: string, userId: string) {
    const set = this.blocksByModel.get(modelId) ?? new Set<string>();
    set.add(userId);
    this.blocksByModel.set(modelId, set);
    return true;
  }
  async unblockUser(modelId: string, userId: string) {
    const set = this.blocksByModel.get(modelId); if (!set) return false;
    set.delete(userId);
    return true;
  }
  async isBlocked(modelId: string, userId: string) {
    const set = this.blocksByModel.get(modelId);
    return !!set && set.has(userId);
  }
  async listBlocks(modelId: string) {
    return Array.from(this.blocksByModel.get(modelId) ?? []);
  }
  async addReport(modelId: string, userId: string, reason: string, details?: string) {
    const r: Report = { id: randomUUID(), modelId, userId, reason, details, createdAt: new Date().toISOString() };
    this.reports.unshift(r);
    return r;
  }
  async listReports() { return this.reports; }

  // public chat (simple in-memory, global)
  async postPublicMessage(user: string, text: string, userId_B?: string) {
    const msg = { id: randomUUID(), user, text, when: new Date().toISOString(), userId_B };
    this.publicChat.unshift(msg);
    // trim
    if (this.publicChat.length > 200) this.publicChat.pop();
    return msg;
  }
  async listPublicMessages(limit = 50) {
    return this.publicChat.slice(0, limit);
  }

  // transaction log
  async addTransaction(t: { userId_A?: string; userId_B?: string; type: 'DEPOSIT'|'WITHDRAWAL'; amount: number; source?: string; externalRef?: string }) {
    const tx = { id: randomUUID(), createdAt: new Date().toISOString(), ...t };
    this.transactions.unshift(tx);
    if (this.transactions.length > 1000) this.transactions.pop();
    return tx;
  }
  async listTransactions(limit = 100) { return this.transactions.slice(0, limit); }

  // private session tracking
  async startSession(userId_B: string, modelId: string) {
    const s = { id: randomUUID(), userId_B, modelId, startAt: new Date().toISOString() };
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
  async listSessions(filter?: { userId_B?: string; modelId?: string; limit?: number }) {
    let arr = this.sessions;
    if (filter?.userId_B) arr = arr.filter(s => s.userId_B === filter.userId_B);
    if (filter?.modelId) arr = arr.filter(s => s.modelId === filter.modelId);
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
  async getUserByUsername(username: string) {
    const target = username.toLowerCase();
    for (const u of this.users.values()) {
      if (u.username.toLowerCase() === target) return u;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
