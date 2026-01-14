// server/services/sirplayClient.ts
import crypto from "crypto";

export type SirplayEnvConfig = {
  baseUrl: string;               // es: https://proxykasynoir.kasynoir.com
  accessUser: string;            // credenziali access token
  accessPass: string;            // credenziali access token
  partnerId?: string;            // opzionale (utile per wallet)
  customerId?: string;           // opzionale (utile per wallet)
};

export function getSirplayConfigFromEnv(): SirplayEnvConfig {
  const baseUrl = (process.env.SIRPLAY_API_URL || process.env.SIRPLAY_BASE_URL || "").trim();
  const accessUser = (process.env.SIRPLAY_ACCESS_USER || process.env.SIRPLAY_API_KEY || "").trim();
  const accessPass = (process.env.SIRPLAY_ACCESS_PASS || process.env.SIRPLAY_ACCESS_PASSWORD || "").trim();

  if (!baseUrl) throw new Error("Missing SIRPLAY_API_URL (or SIRPLAY_BASE_URL)");
  if (!accessUser) throw new Error("Missing SIRPLAY_ACCESS_USER (or SIRPLAY_API_KEY)");
  if (!accessPass) throw new Error("Missing SIRPLAY_ACCESS_PASS (or SIRPLAY_ACCESS_PASSWORD)");

  return {
    baseUrl,
    accessUser,
    accessPass,
    partnerId: (process.env.SIRPLAY_PARTNER_ID || process.env.SIRPLAY_PARTNER || "").trim() || undefined,
    customerId: (process.env.SIRPLAY_CUSTOMER_ID || "").trim() || undefined,
  };
}

// Passport header for wallet calls
export function getSirplayPassportFromEnv(): string {
  const p = (process.env.SIRPLAY_PASSPORT || "").trim();
  if (!p && process.env.NODE_ENV === "production") {
    throw new Error("Missing SIRPLAY_PASSPORT in environment");
  }
  return p;
}

function joinUrl(base: string, path: string) {
  return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

function basicAuthHeader(user: string, pass: string) {
  const b64 = Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
  return `Basic ${b64}`;
}

async function httpJson<T>(
  url: string,
  opts: { method: string; headers?: Record<string, string>; body?: any; timeoutMs?: number }
): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30_000);

  try {
    const res = await fetch(url, {
      method: opts.method,
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
      },
      body: opts.body != null ? JSON.stringify(opts.body) : undefined,
      signal: controller.signal,
    } as any);

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }

    if (!res.ok) {
      const err: any = new Error(`Sirplay HTTP ${res.status} ${res.statusText}`);
      err.status = res.status;
      err.payload = json;
      throw err;
    }
    return json as T;
  } finally {
    clearTimeout(t);
  }
}

// ---------------------------------
// Lightweight client for outbound endpoints (Basic auth)
// Matches usage in server/services/sirplayUsers.ts
// ---------------------------------
export class SirplayClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  // Backward-compatible wrapper state
  private cfg?: SirplayEnvConfig;
  private token?: string;
  private tokenFetchedAt?: number;
  private tokenTtlMs: number = 5 * 60 * 1000; // 5 minutes default

  private constructor(baseUrl: string, headers: Record<string, string>) {
    this.baseUrl = baseUrl;
    this.defaultHeaders = headers;
  }

  /**
   * Build client from environment variables.
   * Uses Basic auth if credentials are provided; otherwise no Authorization header.
   */
  static fromEnv(): SirplayClient {
    const baseUrl = (process.env.SIRPLAY_OUTBOUND_BASE_URL || process.env.SIRPLAY_API_URL || process.env.SIRPLAY_BASE_URL || "").trim();
    if (!baseUrl) throw new Error("Missing SIRPLAY_OUTBOUND_BASE_URL (or SIRPLAY_API_URL/SIRPLAY_BASE_URL)");

    // Prefer explicit B2B basic auth vars; fallback to generic ones if present
    const basicUser = (process.env.SIRPLAY_B2B_USER || process.env.B2B_BASIC_AUTH_USER || "").trim();
    const basicPass = (process.env.SIRPLAY_B2B_PASSWORD || process.env.B2B_BASIC_AUTH_PASS || "").trim();

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (basicUser && basicPass) {
      const b64 = Buffer.from(`${basicUser}:${basicPass}`, "utf8").toString("base64");
      headers["Authorization"] = `Basic ${b64}`;
    }

    const inst = new SirplayClient(baseUrl, headers);
    // Also prepare config for token-based helpers
    try {
      inst.cfg = getSirplayConfigFromEnv();
    } catch {
      // leave cfg undefined if env not suitable for bearer helpers
    }
    inst.tokenTtlMs = 5 * 60 * 1000;
    return inst;
  }

  /**
   * Perform a JSON request with tolerant response shape.
   * Returns status and ok flag without throwing on non-2xx.
   */
  async request<T = any>(method: string, path: string, body?: any, extraHeaders?: Record<string, string>) {
    const url = joinUrl(this.baseUrl, path);
    const headers = { ...this.defaultHeaders, ...(extraHeaders || {}) };

    const res = await fetch(url, {
      method,
      headers,
      body: body != null ? JSON.stringify(body) : undefined,
    } as any);

    const status = res.status;
    const ok = res.ok;
    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // keep raw text when not JSON
    }

    return { ok, status, json, text } as { ok: boolean; status: number; json?: T; text?: string };
  }

  // -----------------------------------------------------------------------------
  // Backward-compatible OOP wrapper (some modules import SirplayClient)
  // -----------------------------------------------------------------------------
  private isTokenValid() {
    if (!this.token || !this.tokenFetchedAt) return false;
    return Date.now() - this.tokenFetchedAt < this.tokenTtlMs;
  }

  async getAccessToken(): Promise<string> {
    const cfg = this.cfg ?? getSirplayConfigFromEnv();
    if (this.isTokenValid()) return this.token!;
    const resp = await sirplayGetAccessToken(cfg);
    this.token = resp.token;
    this.tokenFetchedAt = Date.now();
    if (typeof resp.expiresIn === "number" && resp.expiresIn > 10) {
      this.tokenTtlMs = Math.max(10_000, (resp.expiresIn - 10) * 1000);
    }
    return this.token!;
  }

  // Convenience methods wrapping existing helpers
  async registerUser(payload: Parameters<typeof sirplayRegisterUser>[1]) {
    const cfg = this.cfg ?? getSirplayConfigFromEnv();
    return sirplayRegisterUser(cfg, payload as any);
  }

  async updateUser(payload: Parameters<typeof sirplayUpdateUser>[1]) {
    const cfg = this.cfg ?? getSirplayConfigFromEnv();
    return sirplayUpdateUser(cfg, payload as any);
  }

  async getWallet(token: string, sirplayUserId: string) {
    const cfg = this.cfg ?? getSirplayConfigFromEnv();
    return sirplayGetWallet(cfg, token, sirplayUserId);
  }

  async deposit(
    token: string,
    sirplayUserId: string,
    args: Parameters<typeof sirplayDeposit>[3]
  ) {
    const cfg = this.cfg ?? getSirplayConfigFromEnv();
    return sirplayDeposit(cfg, token, sirplayUserId, args as any);
  }

  async withdrawal(
    token: string,
    sirplayUserId: string,
    args: Parameters<typeof sirplayWithdrawal>[3]
  ) {
    const cfg = this.cfg ?? getSirplayConfigFromEnv();
    return sirplayWithdrawal(cfg, token, sirplayUserId, args as any);
  }
}

/**
 * Access token (Bearer)
 * Endpoint: POST /user-account/signup/players/all/logins
 */
export async function sirplayGetAccessToken(cfg: SirplayEnvConfig): Promise<{
  token: string;
  refreshToken?: string;
  expiresIn?: number;
}> {
  const url = joinUrl(cfg.baseUrl, "/user-account/signup/players/all/logins");

  const resp = await httpJson<any>(url, {
    method: "POST",
    body: { userName: cfg.accessUser, password: cfg.accessPass },
  });

  const token = String(resp?.token || resp?.accessToken || resp?.jwt || "").trim();
  if (!token) {
    const err: any = new Error("Sirplay login missing token");
    err.payload = resp;
    throw err;
  }

  return {
    token,
    refreshToken: typeof resp?.refresh_token === "string" ? resp.refresh_token : undefined,
    expiresIn: typeof resp?.expires_in === "number" ? resp.expires_in : undefined,
  };
}

// Back-compat alias used by routes
// Simple env-based token cache (for service-style usage)
export type TokenCache = {
  token: string;
  refreshToken: string;
  expiresAtMs: number; // epoch ms
};

let envTokenCache: TokenCache | null = null;

export function getSirplayAuthHeaders() {
  if (!envTokenCache) throw new Error("Sirplay token cache empty");
  return { Authorization: `Bearer ${envTokenCache.token}` } as Record<string, string>;
}

// Back-compat alias used by routes, now with optional cfg and env cache when cfg omitted
export async function sirplayLogin(cfg?: SirplayEnvConfig): Promise<TokenCache> {
  const effectiveCfg = cfg ?? getSirplayConfigFromEnv();
  if (!cfg && envTokenCache && Date.now() < envTokenCache.expiresAtMs) {
    return envTokenCache;
  }

  const resp = await sirplayGetAccessToken(effectiveCfg);
  const expiresSec = typeof resp.expiresIn === "number" ? resp.expiresIn : 300;
  const expiresAtMs = Date.now() + Math.max(0, expiresSec - 30) * 1000; // 30s safety margin

  const cacheObj: TokenCache = {
    token: resp.token,
    refreshToken: resp.refreshToken || "",
    expiresAtMs,
  };

  if (!cfg) envTokenCache = cacheObj;
  return cacheObj;
}

export async function getSirplayToken(): Promise<string> {
  if (!envTokenCache || Date.now() >= envTokenCache.expiresAtMs) {
    await sirplayLogin();
  }
  return envTokenCache!.token;
}

/**
 * Refresh validation (opzionale)
 * Endpoint: GET /user-account/signup/auth/validation?refresh=...
 */
export async function sirplayValidateRefresh(cfg: SirplayEnvConfig, bearerToken: string, refreshToken: string) {
  const url = joinUrl(cfg.baseUrl, `/user-account/signup/auth/validation?refresh=${encodeURIComponent(refreshToken)}`);
  return httpJson<any>(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${bearerToken}` },
    body: undefined,
  });
}

export type SirplayRegisterPayload = {
  userName: string;      // immutabile e univoco
  externalId: string;    // id locale operatore (B)
  password: string;
  status: string;        // es: ACTIVE
  created: string;       // ISO date
  birthDate?: string;    // ISO midnight UTC
  name?: string;
  surname?: string;
  email?: string;
  mobilePhone?: string;
  lastUpdated?: string | null;
};

// Overloads for back-compat with routes (with/without token)
export function sirplayRegisterUser(cfg: SirplayEnvConfig, user: SirplayRegisterPayload): Promise<any>;
export function sirplayRegisterUser(cfg: SirplayEnvConfig, token: string, user: SirplayRegisterPayload): Promise<any>;
export async function sirplayRegisterUser(cfg: SirplayEnvConfig, a: any, b?: any) {
  const hasToken = typeof a === "string";
  const token = hasToken ? (a as string) : (await sirplayGetAccessToken(cfg)).token;
  const user: SirplayRegisterPayload = hasToken ? (b as SirplayRegisterPayload) : (a as SirplayRegisterPayload);

  // Endpoint: POST /user-account/signup/b2b/registrations  (Bearer)
  const url = joinUrl(cfg.baseUrl, "/user-account/signup/b2b/registrations");

  const body = {
    eventId: crypto.randomUUID(),
    operation: "REGISTER",
    action: "USER_REGISTRATION",
    eventTime: Date.now(),
    userData: {
      userName: user.userName,
      externalId: user.externalId,
      password: user.password,
      name: user.name,
      surname: user.surname,
      email: user.email,
      status: user.status,
      birthDate: user.birthDate,
      lastUpdated: user.lastUpdated ?? null,
      created: user.created,
      mobilePhone: user.mobilePhone,
    },
  };

  return httpJson<any>(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });
}

export type SirplayUpdateAction =
  | "USER_UPDATE"
  | "USER_CHANGE_PASSWORD"
  | "USER_CHANGE_MAIL"
  | "USER_ACTIVE"
  | "USER_STAGED"
  | "USER_PROVISIONED"
  | "USER_RECOVERY"
  | "USER_PASSWORD_EXPIRED"
  | "USER_LOCKED_OUT"
  | "USER_SUSPENDED"
  | "USER_DEPROVISIONED";

export type SirplayUpdatePayload = {
  userId?: string;       // Sirplay userId (opzionale per compat)
  userName: string;      // immutabile
  externalId?: string;   // opzionale
  lastUpdated?: string;  // ISO
  password?: string;
  status?: string;
  birthDate?: string;
  name?: string;
  surname?: string;
  email?: string;
  created?: string;
  mobilePhone?: string;
};

// Overloads for back-compat: either (cfg, user) with Basic, or (cfg, token, action, userPartial)
export function sirplayUpdateUser(cfg: SirplayEnvConfig, user: SirplayUpdatePayload): Promise<any>;
export function sirplayUpdateUser(cfg: SirplayEnvConfig, token: string, action: SirplayUpdateAction, user: SirplayUpdatePayload): Promise<any>;
export async function sirplayUpdateUser(cfg: SirplayEnvConfig, a: any, b?: any, c?: any) {
  // Always use Basic for UPDATE per spec. Ignore token/action if provided.
  const user: SirplayUpdatePayload = (typeof a === "object" && !b) ? a : (c as SirplayUpdatePayload);

  const url = joinUrl(cfg.baseUrl, "/user-account/signup/b2b/registrations");

  const body = {
    eventId: crypto.randomUUID(),
    operation: "UPDATE",
    action: "USER_UPDATE",
    eventTime: Date.now(),
    userData: {
      userName: user.userName,
      userId: user.userId,
      password: user.password,
      name: user.name,
      surname: user.surname,
      email: user.email,
      status: user.status,
      birthDate: user.birthDate,
      created: user.created,
      lastUpdated: user.lastUpdated ?? new Date().toISOString(),
      mobilePhone: user.mobilePhone,
      externalId: user.externalId,
    },
  };

  return httpJson<any>(url, {
    method: "PUT",
    headers: { Authorization: basicAuthHeader(cfg.accessUser, cfg.accessPass) },
    body,
  });
}

// --------------------
// WALLET B2B (kept for routes compatibility)
// --------------------
export async function sirplayGetWallet(cfg: SirplayEnvConfig, token: string, sirplayUserId: string) {
  const url = joinUrl(cfg.baseUrl, `/wallet/b2b/users/${encodeURIComponent(sirplayUserId)}/wallets`);
  return httpJson<any>(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
}

export async function sirplayDeposit(
  cfg: SirplayEnvConfig,
  token: string,
  sirplayUserId: string,
  args: {
    idTransaction: string;
    amount: number;
    currency?: string;
    description?: string;
    sourceUser?: string;
    externalReference?: string;
  }
) {
  const url = joinUrl(cfg.baseUrl, `/wallet/b2b/users/${encodeURIComponent(sirplayUserId)}/deposits`);
  const body = {
    targetUser: String(sirplayUserId),
    idTransaction: args.idTransaction,
    type: "EXTERNAL_DEPOSIT",
    amount: args.amount,
    currency: args.currency || "EUR",
    description: args.description || "Credit",
    sourceUser: args.sourceUser || "2",
    externalReference: args.externalReference || args.idTransaction,
    partnerId: cfg.partnerId,
    customerId: cfg.customerId,
  };
  return httpJson<any>(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
}

export async function sirplayWithdrawal(
  cfg: SirplayEnvConfig,
  token: string,
  sirplayUserId: string,
  args: {
    idTransaction: string;
    amount: number;
    currency?: string;
    description?: string;
    sourceUser?: string;
    externalReference?: string;
  }
) {
  const url = joinUrl(cfg.baseUrl, `/wallet/b2b/users/${encodeURIComponent(sirplayUserId)}/withdrawals`);
  const body = {
    targetUser: String(sirplayUserId),
    idTransaction: args.idTransaction,
    type: "EXTERNAL_WITHDRAWAL",
    amount: args.amount,
    currency: args.currency || "EUR",
    description: args.description || "Close",
    sourceUser: args.sourceUser || "2",
    externalReference: args.externalReference || args.idTransaction,
    partnerId: cfg.partnerId,
    customerId: cfg.customerId,
  };
  return httpJson<any>(url, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body });
}

// ---------------------------------
// Wallet helpers with explicit passport
// ---------------------------------
export async function sirplayWalletGet(
  cfg: SirplayEnvConfig,
  bearerToken: string,
  passport: string,
  userId: string,
) {
  const url = new URL(`/wallet/b2b/users/${encodeURIComponent(userId)}/wallets`, cfg.baseUrl).toString();
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
      passport,
    },
  } as any);
  const text = typeof (res as any).text === 'function' ? await (res as any).text() : '';
  if (!res.ok) throw new Error(`Sirplay wallet get failed: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function sirplayWalletDeposit(
  cfg: SirplayEnvConfig,
  bearerToken: string,
  passport: string,
  userId: string,
  body: {
    idTransaction: string;
    amount: number;
    currency: string;
    type: "EXTERNAL_DEPOSIT";
    partnerId: string;
    description?: string;
    sourceUser?: string;
    externalReference?: string;
  }
) {
  const url = new URL(`/wallet/b2b/users/${encodeURIComponent(userId)}/deposits`, cfg.baseUrl).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
      passport,
    },
    body: JSON.stringify(body),
  } as any);
  const text = typeof (res as any).text === 'function' ? await (res as any).text() : '';
  if (!res.ok) throw new Error(`Sirplay deposit failed: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

export async function sirplayWalletWithdrawal(
  cfg: SirplayEnvConfig,
  bearerToken: string,
  passport: string,
  userId: string,
  body: {
    idTransaction: string;
    amount: number;
    currency: string;
    type: "EXTERNAL_WITHDRAWAL";
    partnerId: string;
    description?: string;
    sourceUser?: string;
    externalReference?: string;
  }
) {
  const url = new URL(`/wallet/b2b/users/${encodeURIComponent(userId)}/withdrawals`, cfg.baseUrl).toString();
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
      passport,
    },
    body: JSON.stringify(body),
  } as any);
  const text = typeof (res as any).text === 'function' ? await (res as any).text() : '';
  if (!res.ok) throw new Error(`Sirplay withdrawal failed: ${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}
