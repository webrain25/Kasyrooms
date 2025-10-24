# Deploy (VPS with PM2 + Nginx)

## Build on the server

```bash
# in project directory
npm install --include=dev --no-audit --no-fund
node ./node_modules/vite/bin/vite.js build
npx --yes esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
```

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

## Verify

```bash
curl -sS https://www.dev.kasyrooms.com/api/healthz
curl -sS -L https://www.dev.kasyrooms.com/api/version
curl -sS -H "Content-Type: application/json" -d '{"username":"admin"}' https://www.dev.kasyrooms.com/api/auth/login
```

If /api/version or /api/auth/login does not return JSON, the running process is not the latest build or the Nginx upstream routes POST /api/* incorrectly. Ensure PM2 reloaded the correct process and Nginx forwards both GET and POST under /api/ to Node.
