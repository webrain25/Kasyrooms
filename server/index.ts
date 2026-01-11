// server/index.ts

// Load environment variables early
import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import fsSync from "fs";
import crypto from "crypto";

import { registerRoutes } from "./routes";
import limiterMiddleware from "./middleware/limiter";
import { requestLogger, errorLogger } from "./middleware/request-logger";
import { logger } from "./logger";
import { storage } from "./storage";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";
import { initSignaling } from "./rtc/signaling";

// Prefer loading env from APP_ENV_FILE (inline content or file path). Fallback to local .env only if absent.
(() => {
  const inline = process.env.APP_ENV_FILE;

  const loadFromAppEnv = () => {
    if (!inline) return false;

    try {
      const isPath =
        inline.startsWith("file://") ||
        inline.startsWith("/") ||
        /^[a-zA-Z]:\\/.test(inline);

      const content = isPath
        ? fsSync.readFileSync(inline.replace(/^file:\/\//, ""), "utf8")
        : inline;

      const parsed = dotenv.parse(content);
      for (const [k, v] of Object.entries(parsed)) {
        process.env[k] = v as string; // override to ensure source of truth is APP_ENV_FILE
      }

      // eslint-disable-next-line no-console
      console.log("[env] APP_ENV_FILE loaded");
      return true;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("[env] Failed to load APP_ENV_FILE:", (e as Error).message);
      return false;
    }
  };

  const ok = loadFromAppEnv();
  if (!ok) {
    const res = dotenv.config();
    if (res.parsed) {
      // eslint-disable-next-line no-console
      console.log("[env] .env loaded");
    }
  }
})();

// ---- ENV DIAGNOSTICS (temporary) ----
(() => {
  const hasAppEnv = !!process.env.APP_ENV_FILE;

  const hasB2BUser = typeof process.env.B2B_BASIC_AUTH_USER === "string" && process.env.B2B_BASIC_AUTH_USER.trim().length > 0;
  const hasB2BPass = typeof process.env.B2B_BASIC_AUTH_PASS === "string" && process.env.B2B_BASIC_AUTH_PASS.trim().length > 0;

  const hasSirplayB2BUser = typeof process.env.SIRPLAY_B2B_USER === "string" && process.env.SIRPLAY_B2B_USER.trim().length > 0;
  const hasSirplayB2BPass = typeof process.env.SIRPLAY_B2B_PASSWORD === "string" && process.env.SIRPLAY_B2B_PASSWORD.trim().length > 0;

  // Non loggare i valori, solo presenza e lunghezze (utile per capire se sono vuoti o troncati)
  // eslint-disable-next-line no-console
  console.log("[env] APP_ENV_FILE present:", hasAppEnv);

  // eslint-disable-next-line no-console
  console.log("[env] B2B_BASIC_AUTH_USER present:", hasB2BUser, "len:", (process.env.B2B_BASIC_AUTH_USER || "").length);
  // eslint-disable-next-line no-console
  console.log("[env] B2B_BASIC_AUTH_PASS present:", hasB2BPass, "len:", (process.env.B2B_BASIC_AUTH_PASS || "").length);

  // eslint-disable-next-line no-console
  console.log("[env] SIRPLAY_B2B_USER present:", hasSirplayB2BUser, "len:", (process.env.SIRPLAY_B2B_USER || "").length);
  // eslint-disable-next-line no-console
  console.log("[env] SIRPLAY_B2B_PASSWORD present:", hasSirplayB2BPass, "len:", (process.env.SIRPLAY_B2B_PASSWORD || "").length);
})();

const app = express();
const IS_PROD = process.env.NODE_ENV === "production";

// MUST be before any middleware that reads req.ip / req.ips (rate-limit, logging, auth, etc.)
app.set("trust proxy", 2); // Cloudflare + Nginx (2 hops). If only 1 proxy, set to 1.

// Structured request logging
app.use(requestLogger);

// Base limiter in production; optionally enable in dev for testing via env flag
if (IS_PROD || process.env.RATE_LIMIT_ENABLE_DEV === "1") {
  app.use(limiterMiddleware);
}

/**
 * express-rate-limit expects: (req) => string
 * ipKeyGenerator expects: (ip: string, ipv6Subnet?) => string
 * Bridge the two: extract best-effort client IP, then normalize with ipKeyGenerator(ip)
 */
const rlKey: (req: Request) => string = (req) => {
  const xff = req.headers["x-forwarded-for"];
  const xffFirst =
    typeof xff === "string"
      ? xff.split(",")[0]?.trim()
      : Array.isArray(xff)
        ? xff[0]?.trim()
        : undefined;

  const ip =
    (req.ip && req.ip.trim()) ||
    (xffFirst && xffFirst.trim()) ||
    (req.socket.remoteAddress && req.socket.remoteAddress.trim()) ||
    "0.0.0.0";

  return ipKeyGenerator(ip);
};

// Per-request CSP nonce
app.use((req: Request, res: Response, next: NextFunction) => {
  res.locals = res.locals ?? {};
  res.locals.cspNonce = crypto.randomBytes(16).toString("base64");
  next();
});

// Security headers
app.use(
  helmet({
    // Allow other origins to embed our resources (for public image consumption/CDN)
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Disable COEP to avoid breaking cross-origin media/fonts in browsers without proper CORP/CORS
    crossOriginEmbedderPolicy: false,
    // CSP with nonce and explicit allowlists; active only in production
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
            useDefaults: true,
            directives: {
              defaultSrc: ["'self'"],
              baseUri: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
              imgSrc: (() => {
                const allowAll = process.env.CSP_IMG_ALLOW_ALL === "1";
                const list = [
                  "'self'",
                  "data:",
                  "blob:",
                  "https://images.unsplash.com",
                  "https://*.unsplash.com",
                  "https://cdn.kasyrooms.com",
                  "https://*.r2.cloudflarestorage.com",
                ];
                return allowAll ? ["'self'", "data:", "blob:", "https:"] : list;
              })(),
              mediaSrc: ["'self'", "https:", "blob:"],
              fontSrc: ["'self'", "https:", "data:", "https://fonts.gstatic.com"],
              styleSrc: ["'self'", "'unsafe-inline'", "https:", "https://fonts.googleapis.com"],
              // Helmet typings don't strongly type callback args; keep them permissive.
              scriptSrc: [
                "'self'",
                "https:",
                (_req: any, res: any) => `'nonce-${res?.locals?.cspNonce}'`,
              ],
              connectSrc: [
                "'self'",
                "https:",
                "wss:",
                "https://api.kasyrooms.com",
                "https://cdn.kasyrooms.com",
                "https://*.ingest.sentry.io",
              ],
              workerSrc: ["'self'", "blob:"],
              frameSrc: ["'self'", "https:"],
              formAction: ["'self'"],
              upgradeInsecureRequests: [],
            },
          }
        : false,
  })
);

// CORS: allow only our frontend domains (and credentials)
app.use(
  cors({
    origin: [
      "https://dev.kasyrooms.com",
      "https://www.dev.kasyrooms.com",
      "https://kasyrooms.com",
      "https://www.kasyrooms.com",
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  })
);

// Basic health endpoint (used by load balancers / monitors)
app.get("/health", (_req: Request, res: Response) => {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ ok: true, time: new Date().toISOString() });
});

// Capture raw body for HMAC verification while parsing JSON
app.use(
  express.json({
    verify: (req: any, _res: any, buf: Buffer) => {
      req.rawBody = buf;
    },
  })
);

// Handle invalid JSON with 400 instead of 500
app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  const e = err as any;

  // body-parser sets err.status = 400 on invalid JSON; types don't expose it, so treat as unknown/any.
  const statusVal = typeof e?.status === "number" ? (e.status as number) : undefined;

  const isBodyParserSyntax =
    e instanceof SyntaxError &&
    statusVal === 400 &&
    e != null &&
    typeof e === "object" &&
    "body" in e;

  if (isBodyParserSyntax) {
    return res.status(400).json({ error: "invalid_json" });
  }

  return next(err);
});

// Targeted rate limits (production only)
if (IS_PROD) {
  const authLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rlKey,
  });

  const registerLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Troppe richieste, riprova più tardi." },
    keyGenerator: rlKey,
  });

  const chatLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rlKey,
  });

  const modelsLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rlKey,
  });

  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", registerLimiter);
  app.use(["/api/chat", "/api/chat/public"], chatLimiter);
  app.use(["/api/models", "/api/home/models", "/api/models-home"], modelsLimiter);

  // Optional heuristics (production only)
  const ipHitCounter = new Map<string, { count: number; ts: number }>();
  app.use(
    ["/api/models", "/api/home/models", "/api/models-home"],
    (req: Request, _res: Response, next: NextFunction) => {
      try {
        const key = String(
          (req.headers["x-forwarded-for"] as string) ||
            req.socket.remoteAddress ||
            "unknown"
        );

        const now = Date.now();
        const rec = ipHitCounter.get(key) || { count: 0, ts: now };

        if (now - rec.ts > 60_000) {
          rec.count = 0;
          rec.ts = now;
        }

        rec.count++;
        ipHitCounter.set(key, rec);

        if (rec.count > 500) {
          storage
            .addAudit({ action: "anti_scrape_suspect", meta: { ip: key, count: rec.count } })
            .catch(() => {});
          rec.count = 0;
          rec.ts = now;
        }
      } catch {
        // ignore
      }

      next();
    }
  );

  const dmcaLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rlKey,
  });

  const kycLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rlKey,
  });

  const tipLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rlKey,
  });

  app.use("/api/dmca/report", dmcaLimiter);
  app.use("/api/kyc/apply", kycLimiter);
  app.use("/api/models/:id/tip", tipLimiter);

  // Sirplay-specific rate limits
  const sirplayAuthLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rlKey,
  });

  const sirplayWebhookLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: rlKey,
  });

  app.use(["/api/sirplay/handshake", "/api/sirplay/login"], sirplayAuthLimiter);
  app.use(["/api/webhooks/sirplay"], sirplayWebhookLimiter);
}

// API routes (pass app version for diagnostics)
let appVersion = "dev";
try {
  const pkgRaw = fsSync.readFileSync(
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json"),
    "utf-8"
  );
  const pkg = JSON.parse(pkgRaw);
  if (pkg?.version) appVersion = String(pkg.version);
} catch {
  // ignore
}

const server = await registerRoutes(app, { version: appVersion });

// Initialize WebSocket signaling server for WebRTC rooms
initSignaling(server);
logger.info("signaling.initialized");

// In development, mount Vite dev middleware; in production, serve static from /dist/public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === "production";

const clientRoot = path.resolve(__dirname, "..", "client");
const clientDist = path.resolve(__dirname, "..", "dist", "public");
const uploadsRoot = path.resolve(__dirname, "..", "uploads");

if (!isProd) {
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    configFile: path.resolve(__dirname, "..", "vite.config.ts"),
    server: { middlewareMode: true },
  });

  app.use(vite.middlewares);

  app.get("*", async (req: Request, res: Response, next: NextFunction) => {
    try {
      const url = req.originalUrl;
      const indexHtmlPath = path.resolve(clientRoot, "index.html");
      let html = await fs.readFile(indexHtmlPath, "utf-8");
      html = await vite.transformIndexHtml(url, html);
      res.setHeader("Content-Type", "text/html");
      res.status(200).end(html);
    } catch (e) {
      next(e);
    }
  });
} else {
  // Production: serve built assets
  // Also serve uploaded assets under /uploads
  try {
    fsSync.mkdirSync(uploadsRoot, { recursive: true });
  } catch {
    // ignore
  }

  app.use(
    "/uploads",
    express.static(uploadsRoot, {
      etag: true,
      lastModified: true,
      setHeaders: (res, p) => {
        const rel = p.replace(/\\/g, "/");
        if (/(\/models\/).+\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(rel)) {
          res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
        } else {
          res.setHeader("Cache-Control", "public, max-age=300");
        }
      },
    })
  );

  // Static assets: cache aggressively for hashed asset files; avoid caching for index.html
  app.use(
    express.static(clientDist, {
      etag: true,
      lastModified: true,
      setHeaders: (res, p) => {
        const rel = p.replace(/\\/g, "/");
        if (rel.endsWith("/index.html") || rel.endsWith("index.html")) {
          res.setHeader("Cache-Control", "no-cache");
        } else if (rel.includes("/assets/")) {
          res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        } else {
          res.setHeader("Cache-Control", "public, max-age=300");
        }
      },
    })
  );

  app.get("*", (_req: Request, res: Response) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

// Start server with retry if port is in use to avoid "stuck"/crash scenarios in dev
const basePort = parseInt(process.env.PORT || "5000", 10);
// Explicit host binding to avoid IPv6-only binding issues on Windows
const baseHost = process.env.HOST || "127.0.0.1"; // set to "0.0.0.0" to listen on all interfaces

function listenWithRetry(port: number, attemptsLeft: number, host: string) {
  let started = false;

  const attachAndListen = (p: number, tries: number) => {
    server.removeAllListeners("error");

    server.once("error", (err: any) => {
      if (started) return;

      if (err?.code === "EADDRINUSE" && tries > 0) {
        const nextPort = p + 1;
        // eslint-disable-next-line no-console
        console.warn(`[kasyrooms] Port ${host}:${p} in use, retrying on ${host}:${nextPort}...`);
        attachAndListen(nextPort, tries - 1);
      } else {
        // eslint-disable-next-line no-console
        console.error("[kasyrooms] Server failed to start:", err);
        process.exit(1);
      }
    });

    server.listen(p, host, () => {
      if (started) return;
      started = true;
      // eslint-disable-next-line no-console
      console.log(`[kasyrooms] listening on ${host}:${p} (${isProd ? "production" : "development"})`);
    });
  };

  attachAndListen(port, attemptsLeft);
}

listenWithRetry(basePort, 10, baseHost);
logger.info("server.starting", { host: baseHost, port: basePort });

// -------------------
// Server-side billing loop for private sessions
// Charges per minute and auto-ends on insufficient funds
// -------------------
(function startBillingLoop() {
  const RATE_PER_MIN = Number.parseFloat(process.env.RATE_PER_MIN || "5.99");
  const TICK_MS = Number.parseInt(process.env.BILLING_TICK_MS || "10000", 10); // default 10s
  if (!Number.isFinite(RATE_PER_MIN) || RATE_PER_MIN <= 0) return;

  setInterval(async () => {
    const now = Date.now();

    for (const s of storage.sessions) {
      if (s.endAt) continue;

      const lastChargeAt = Date.parse(s.lastChargeAt || s.startAt);
      if (!Number.isFinite(lastChargeAt)) continue;

      const elapsedMs = now - lastChargeAt;
      const minutesToCharge = Math.floor(elapsedMs / 60000);
      if (minutesToCharge <= 0) continue;

      const user = await storage.getUser(s.userId_B);
      if (!user) continue;

      const isShared = !!user.externalUserId;
      const walletIdA = user.externalUserId!;

      let chargedMinutes = 0;

      for (let i = 0; i < minutesToCharge; i++) {
        try {
          const currentBalance = isShared
            ? await storage.getBalance(walletIdA)
            : await storage.getLocalBalance(user.id);

          if (currentBalance < RATE_PER_MIN) {
            const durationSec = Math.max(
              1,
              Math.floor((Date.now() - Date.parse(s.startAt)) / 1000)
            );

            await storage.endSession(s.id, {
              durationSec,
              totalCharged: s.totalCharged || 0,
            });

            try {
              if (db) {
                await db
                  .update(schema.sessions)
                  .set({
                    endedAt: new Date() as any,
                    durationSec,
                    totalChargedCents: Math.round((s.totalCharged || 0) * 100),
                  })
                  .where(eq(schema.sessions.id, s.id));
              }
            } catch {
              // ignore
            }

            try {
              await storage.setModelBusy(s.modelId, false);
            } catch {
              // ignore
            }

            break;
          }

          if (isShared) {
            await storage.withdraw(walletIdA, RATE_PER_MIN);
            const tx = await storage.addTransaction({
              userId_A: walletIdA,
              type: "CHARGE",
              amount: RATE_PER_MIN,
              source: "server-billing",
            });

            try {
              if (db) {
                await db.insert(schema.transactions).values({
                  id: tx.id,
                  userId_A: walletIdA,
                  type: "CHARGE",
                  amountCents: Math.round(RATE_PER_MIN * 100),
                  currency: "EUR",
                  source: "server-billing",
                });
              }
            } catch {
              // ignore
            }
          } else {
            try {
              await storage.localWithdraw(user.id, RATE_PER_MIN);
            } catch {
              const durationSec = Math.max(
                1,
                Math.floor((Date.now() - Date.parse(s.startAt)) / 1000)
              );

              await storage.endSession(s.id, {
                durationSec,
                totalCharged: s.totalCharged || 0,
              });

              try {
                if (db) {
                  await db
                    .update(schema.sessions)
                    .set({
                      endedAt: new Date() as any,
                      durationSec,
                      totalChargedCents: Math.round((s.totalCharged || 0) * 100),
                    })
                    .where(eq(schema.sessions.id, s.id));
                }
              } catch {
                // ignore
              }

              try {
                await storage.setModelBusy(s.modelId, false);
              } catch {
                // ignore
              }

              break;
            }

            const tx = await storage.addTransaction({
              userId_B: user.id,
              type: "CHARGE",
              amount: RATE_PER_MIN,
              source: "server-billing",
            });

            try {
              if (db) {
                await db.insert(schema.transactions).values({
                  id: tx.id,
                  userId_B: user.id,
                  type: "CHARGE",
                  amountCents: Math.round(RATE_PER_MIN * 100),
                  currency: "EUR",
                  source: "server-billing",
                });
              }
            } catch {
              // ignore
            }
          }

          s.totalCharged = (s.totalCharged || 0) + RATE_PER_MIN;
          chargedMinutes++;
        } catch {
          break;
        }
      }

      if (chargedMinutes > 0) {
        const nextTs = lastChargeAt + chargedMinutes * 60000;
        s.lastChargeAt = new Date(nextTs).toISOString();

        try {
          if (db) {
            await db
              .update(schema.sessions)
              .set({ totalChargedCents: Math.round((s.totalCharged || 0) * 100) })
              .where(eq(schema.sessions.id, s.id));
          }
        } catch {
          // ignore
        }
      }
    }
  }, TICK_MS);
})();

// Error logger middleware (after routes)
app.use(errorLogger);
