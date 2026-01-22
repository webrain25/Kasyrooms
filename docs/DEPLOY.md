# Deployment Guide

This project ships a Node API + React SPA build. Use this guide to deploy behind Nginx and (optionally) Cloudflare.

## Node app
- Runs on port 5000 via PM2 (ecosystem.config.cjs)
- Serves the SPA from dist/public in production
- Important: Always proxy /api/* to the Node app; do not let the SPA catch-all handle /api/*.

## Nginx (sample)
See `ops/nginx.sample.conf` for a complete server block. Key points:
- Place the `/api/` location before any other `location` blocks.
- Proxy /api/* to `http://127.0.0.1:5000`.
- Serve static files from `dist/public`.
- Use SPA fallback only for non-API routes.

## Cloudflare (recommended rules)
If you use Cloudflare in front of Nginx:
- Create a Cache Rule: Bypass cache for `/api/*`.
- Ensure the cache respects query strings (Cache key includes Query string: Include All).
- Optionally, cache `/assets/*` aggressively (immutable hashed files).

## Build on the server

```bash
# in project directory
npm install --include=dev --no-audit --no-fund
node ./node_modules/vite/bin/vite.js build
npx --yes esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

## DB schema (Neon PROD) without db:push

This repo uses targeted, idempotent DDL scripts (no `drizzle-kit push`) to ensure the minimum tables exist in Neon.

Production note:
- Keep `AUTH_MODE=hybrid` in PROD to support both identity domains (Sirplay accounts + local users).

- Sirplay domain: `accounts`, `wallet_snapshots`, `wallet_transactions`
- Local domain: `users`, `wallets`, `user_profiles`
	- In practice, `npm run db:ensure:local` ensures the full legacy/local schema used by the app (models, cards, ratings, transactions, sessions, dmca, kyc, audit, ...).

Choose by `AUTH_MODE`:

- `AUTH_MODE=sirplay` => ensure Sirplay domain only: `npm run db:ensure:sirplay`
- `AUTH_MODE=local` => ensure Local domain only: `npm run db:ensure:local`
- `AUTH_MODE=hybrid` => ensure both domains

If you prefer applying the local-auth schema via SQL migration on Neon (instead of running Node scripts), execute:
- `migrations/2026-01-21_create_users_wallets.sql`

If Neon PROD is empty and you want a single init SQL for the full HYBRID schema (legacy/local + sirplay/canonical), execute:
- `migrations/2026-01-22_init_neon_hybrid_schema.sql`

This prevents the common PROD error on local register:
- `42P01 relation "users" does not exist`

The deploy script [scripts/deploy.sh](scripts/deploy.sh) runs these automatically if `DATABASE_URL` is available.

## Start with PM2 (zero-downtime ready)

```bash
# first time (ecosystem is configured with cluster: 2 instances)
pm2 start ecosystem.config.cjs

# apply ecosystem changes (cluster/instances/env) on every deploy
pm2 startOrReload ecosystem.config.cjs

# or, if already aligned and you only need a hot reload (no downtime)
pm2 reload kasyrooms

# status & logs
pm2 status
pm2 logs kasyrooms --lines 200
```

## Post-deploy smoke

```bash
curl -sS https://dev.kasyrooms.com/api/healthz | head -c 200; echo
curl -sS -L https://dev.kasyrooms.com/api/version | head -c 200; echo
curl -sS https://dev.kasyrooms.com/api/models | head -c 200; echo
curl -sS "https://dev.kasyrooms.com/api/models?home=1" | head -c 200; echo
```

If any endpoint returns HTML, Nginx or Cloudflare is serving the SPA or cache instead of the API – fix proxy rules as above.
