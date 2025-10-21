#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/deploy.sh /var/www/kasyrooms
APP_DIR=${1:-$(pwd)}
cd "$APP_DIR"

# Ensure Node and PM2 installed
if ! command -v node >/dev/null 2>&1; then
  echo "Node not installed" >&2; exit 1
fi
if ! command -v pm2 >/dev/null 2>&1; then
  echo "PM2 not installed (npm i -g pm2)" >&2; exit 1
fi

# Install deps
npm install --include=dev --no-audit --no-fund

# Build
node ./node_modules/vite/bin/vite.js build
npx --yes esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# Start or restart
if pm2 describe kasyrooms >/dev/null 2>&1; then
  pm2 restart kasyrooms
else
  pm2 start ecosystem.config.cjs
fi

pm2 save || true

echo "Deploy completed. Check: /api/healthz, /api/version, /api/auth/login"
