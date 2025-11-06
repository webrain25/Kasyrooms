
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";
import fsSync from "fs";
import { registerRoutes } from "./routes";

const app = express();

// Security headers (allow cross-origin images for model photos/CDNs)
app.use(
  helmet({
    // Allow other origins to embed our resources
    crossOriginResourcePolicy: { policy: "cross-origin" },
    // Disable COEP which otherwise blocks cross-origin images/videos/fonts unless they send CORP/CORS
    crossOriginEmbedderPolicy: false,
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

// Global rate limit (optional)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(globalLimiter);
// Capture raw body for HMAC verification while parsing JSON
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  }
}));

// Stricter limit for registration attempts
const registerLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Troppe richieste, riprova più tardi." },
});
// Apply to registration endpoint path (our route is /api/auth/register)
app.use("/api/auth/register", registerLimiter);

// API routes (pass app version for diagnostics)
let appVersion = "dev";
try {
  const pkgRaw = fsSync.readFileSync(path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "package.json"), "utf-8");
  const pkg = JSON.parse(pkgRaw);
  if (pkg?.version) appVersion = String(pkg.version);
} catch {}
const server = await registerRoutes(app, { version: appVersion });

// In development, mount Vite dev middleware; in production, serve static from /dist/public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === "production";

const clientRoot = path.resolve(__dirname, "..", "client");
const clientDist = path.resolve(__dirname, "..", "dist", "public");

if (!isProd) {
  // Vite dev server in middleware mode for a smooth DX
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    configFile: path.resolve(__dirname, "..", "vite.config.ts"),
    server: { middlewareMode: true },
  });

  app.use(vite.middlewares);

  app.get("*", async (req, res, next) => {
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
  // Static assets: cache aggressively for hashed asset files; avoid caching for index.html
  app.use(express.static(clientDist, {
    etag: true,
    lastModified: true,
    setHeaders: (res, p) => {
      const rel = p.replace(/\\/g, "/");
      if (rel.endsWith("/index.html") || rel.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      } else if (rel.includes("/assets/")) {
        // Vite emits hashed filenames under /assets; safe to cache long-term
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      } else {
        // default short cache for other files
        res.setHeader("Cache-Control", "public, max-age=300");
      }
    }
  }));
  app.get("*", async (_req, res) => {
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
    // ensure previous error listeners don't accumulate
    server.removeAllListeners("error");
    server.once("error", (err: any) => {
      if (started) return; // already started elsewhere
      if (err && (err as any).code === "EADDRINUSE" && tries > 0) {
        const nextPort = p + 1;
        console.warn(`[kasyrooms] Port ${host}:${p} in use, retrying on ${host}:${nextPort}...`);
        attachAndListen(nextPort, tries - 1);
      } else {
        console.error("[kasyrooms] Server failed to start:", err);
        process.exit(1);
      }
    });
    server.listen(p, host, () => {
      if (started) return;
      started = true;
      console.log(`[kasyrooms] listening on ${host}:${p} (${isProd ? "production" : "development"})`);
    });
  };
  attachAndListen(port, attemptsLeft);
}

listenWithRetry(basePort, 10, baseHost);
