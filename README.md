# Kasyrooms

[![Deploy to VPS](https://github.com/webrain25/Kasyrooms/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/webrain25/Kasyrooms/actions/workflows/deploy.yml)
[![Live](https://img.shields.io/website?url=https%3A%2F%2Fdev.kasyrooms.com&up_message=online&down_message=offline)](https://dev.kasyrooms.com)

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

## Demo login

Endpoint: POST /api/auth/login with JSON body { "username": "..." }

Utenti disponibili (nessuna password richiesta):
- utente → id: u-001, role: user
- modella → id: m-001, role: model
- admin → id: a-001, role: admin

Esempio (PowerShell):
```powershell
Invoke-RestMethod -Uri "https://dev.kasyrooms.com/api/auth/login" -Method Post -ContentType 'application/json' -Body '{"username":"admin"}'
```

## Deploy

See `docs/DEPLOY.md` for PM2 + Nginx, and `docs/DEPLOY_GIT.md` for Git-based deployments or GitHub Actions.
