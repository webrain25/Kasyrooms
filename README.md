# Kasyrooms

React + Vite frontend with an Express backend (bundled with esbuild) and PM2 + Nginx for deployment.

## Quick start (dev)

```bash
# Windows PowerShell (from project root)
npm install --include=dev --no-audit --no-fund
npm run dev
```

## Build & run (prod)

```bash
node .\node_modules\vite\bin\vite.js build
npx --yes esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
$env:NODE_ENV="production"; $env:HOST="127.0.0.1"; $env:PORT="5000"; node dist/index.js
```

## API smoke test (no port binding)

```bash
npm run smoke
```

## Deploy

See `docs/DEPLOY.md` for PM2 + Nginx, and `docs/DEPLOY_GIT.md` for Git-based deployments or GitHub Actions.
