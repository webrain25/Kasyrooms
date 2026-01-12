#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/deploy.sh /var/www/kasyrooms
APP_DIR=${1:-$(pwd)}
cd "$APP_DIR"

# Ensure env file is written for PM2 if APP_ENV_FILE provided
ENV_DEST=${ENV_DEST:-/var/www/kasyrooms/.env}
if [ -n "${APP_ENV_FILE:-}" ]; then
  # APP_ENV_FILE can be inline env content or a file path (optionally file:// prefixed)
  case "$APP_ENV_FILE" in
    file://*) SRC="${APP_ENV_FILE#file://}" ;;
    /*) SRC="$APP_ENV_FILE" ;;
    [A-Za-z]:\\*) SRC="$APP_ENV_FILE" ;;
    *) SRC="" ;;
  esac
  if [ -n "$SRC" ] && [ -f "$SRC" ]; then
    cp "$SRC" "$ENV_DEST"
    echo "[deploy] Copied APP_ENV_FILE '$SRC' to '$ENV_DEST'"
  else
    printf "%s" "$APP_ENV_FILE" > "$ENV_DEST"
    echo "[deploy] Wrote inline APP_ENV_FILE content to '$ENV_DEST'"
  fi
fi

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
