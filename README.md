# Kasyrooms

[![Deploy to VPS](https://github.com/webrain25/Kasyrooms/actions/workflows/deploy.yml/badge.svg?branch=main)](https://github.com/webrain25/Kasyrooms/actions/workflows/deploy.yml)
[![Live](https://img.shields.io/website?url=https%3A%2F%2Fdev.kasyrooms.com&up_message=online&down_message=offline)](https://dev.kasyrooms.com)

React + Vite frontend with an Express backend (bundled with esbuild) and PM2 + Nginx for deployment.

## Caratteristiche (ITA)

- Frontend (SPA)
	- React 18 + Vite, routing con Wouter
	- TailwindCSS + componenti shadcn/Radix pronti all’uso (alert, dialog, drawer, form, input, menubar, navigation-menu, pagination, popover, progress, radio-group, select, sheet, sidebar, skeleton, slider, switch, table, tabs, toast, tooltip, ecc.)
	- Header con ricerca e preferiti; badge LIVE per modella quando online
	- Home con:
		- Hero carousel
		- Filtri: Online Now, Top Rated, New, Trending, Favorites, All
		- Ricerca con risultati dedicati
		- Griglia modelli (cards minimali) con stato online/busy/offline, badge NEW, rank (opzionale), toggle preferiti, CTA “Inizia Chat” evidenziata
		- Banner “Apri la tua Room” per utenti con ruolo modella
	- Login classico + accesso demo rapido (utente/modella/admin)
	- “La tua Room” (Dashboard Modella):
		- Stato Live: toggle Online/Offline
		- Preferenze: “Auto‑online all’ingresso” (persistenza in localStorage)
		- Chat pubblica: lista messaggi, invio, fino a 200 in memoria con timestamp; memorizzazione opzionale di userId_B per correlazione
		- Private Show: avvio per userId oppure per username; termine sessione con riepilogo; set busy true/false; toasts
		- Utenti recenti in chat: chip cliccabili per avvio rapido (per id/username), pulsante “Pulisci elenco” con persistenza del timestamp
		- Profilo modella: modifica nome visualizzato, aggiunta/lista foto
	- Pagine ausiliarie: Not Found 404; toasts e i18n hooks (t(...)) già integrati nelle UI

- Backend (API Express, ESM)
	- CORS abilitato; parsing JSON con raw body per verifiche HMAC
	- Servizio statico in produzione con Cache‑Control ottimizzato: index.html no‑cache, asset hashati long‑cache
	- Endpoints principali:
		- Modelli: GET /api/models, GET /api/models/:id, PATCH /api/models/:id/status (online), PATCH /api/models/:id/busy (busy)
		- Profilo/Foto Modella: PATCH /api/models/:id, POST/GET /api/models/:id/photos
		- Sessioni Private: POST /api/sessions/start, POST /api/sessions/:id/end, POST /api/sessions/start-by-username
		- Moderazione: report/block/unblock, lista blocchi, lista report (admin)
		- Chat Pubblica: GET/POST /api/chat/public (con supporto userId_B)
		- Wallet (demo): GET /api/wallet/balance, POST /api/wallet/deposit, POST /api/wallet/withdrawal
		- Operatore (admin): GET /api/operator/transactions, GET /api/operator/sessions
		- Auth demo: POST /api/auth/login (JWT) per utenti seed (utente, modella, admin)
		- Health & Version: GET /api/healthz, GET /api/version
		- Integrazione Sirplay (demo): registrazione utente, info player, SSO token/validate, webhook con verifica HMAC
	- Storage in‑memory: utenti (u‑001, m‑001, a‑001), modelli fittizi, bilanci (locali e condivisi), transazioni, sessioni, moderazione (blocchi/report), chat pubblica

- DevOps & Deploy
	- Build: Vite (client) + esbuild (server)
	- PM2 in cluster (2 istanze) per zero‑downtime reload
	- GitHub Actions
		- CI: typecheck + build
		- Deploy: build, upload su VPS via SCP, npm ci, pm2 startOrReload, verifica /api/version
	- Nginx reverse proxy (guide in docs), endpoint /api/version per diagnostica

- Testing & Strumenti
	- Script PowerShell end‑to‑end (scripts/test-demo.ps1) per health, login, deposito, avvio/chiusura sessione, viste operatore
	- Smoke test API (npm run smoke)

## Features (ENG)

- Frontend (SPA)
	- React 18 + Vite, routing via Wouter
	- TailwindCSS + shadcn/Radix components (alert, dialog, drawer, form, input, menubar, navigation-menu, pagination, popover, progress, radio-group, select, sheet, sidebar, skeleton, slider, switch, table, tabs, toast, tooltip, etc.)
	- Header with search and favorites; LIVE badge for model when online
	- Home includes:
		- Hero carousel
		- Filters: Online Now, Top Rated, New, Trending, Favorites, All
		- Search with a dedicated results section
		- Models grid (minimal cards) with online/busy/offline dot, NEW badge, optional rank, favorites toggle, highlighted “Start Chat” CTA
		- “Open your Room” banner for logged‑in models
	- Login form + quick demo login (user/model/admin)
	- “Your Room” (Model Dashboard):
		- Live status: Online/Offline toggle
		- Preferences: “Auto‑online on entry” (localStorage persistence)
		- Public chat: message list and send, up to 200 in memory with timestamps; optional userId_B persistence for correlation
		- Private Show: start by userId or by username; end session with summary; busy flag on/off; toast notifications
		- Recent chat users: quick chips to start by id/username; “Clear list” with persisted timestamp
		- Model profile: edit display name, add/list photos
	- Auxiliary pages: Not Found 404; toasts and i18n hooks already wired in UI

- Backend (Express API, ESM)
	- CORS enabled; JSON parsing with raw body capture for HMAC verification
	- Production static serving with tuned Cache‑Control: index.html no‑cache, hashed assets long‑cache
	- Main endpoints:
		- Models: GET /api/models, GET /api/models/:id, PATCH /api/models/:id/status (online), PATCH /api/models/:id/busy (busy)
		- Model Profile/Photos: PATCH /api/models/:id, POST/GET /api/models/:id/photos
		- Private Sessions: POST /api/sessions/start, POST /api/sessions/:id/end, POST /api/sessions/start-by-username
		- Moderation: report/block/unblock, list blocks, list reports (admin)
		- Public Chat: GET/POST /api/chat/public (with userId_B capture)
		- Wallet (demo): GET /api/wallet/balance, POST /api/wallet/deposit, POST /api/wallet/withdrawal
		- Operator (admin): GET /api/operator/transactions, GET /api/operator/sessions
		- Demo auth: POST /api/auth/login (JWT) for seeded users (utente, modella, admin)
		- Health & Version: GET /api/healthz, GET /api/version
		- Sirplay integration (demo): user registration, player info, SSO token/validate, webhook with HMAC verification
	- In‑memory storage: users (u‑001, m‑001, a‑001), fake models, balances (local & shared), transactions, sessions, moderation (blocks/reports), public chat

- DevOps & Deploy
	- Build: Vite (client) + esbuild (server)
	- PM2 cluster (2 instances) for zero‑downtime reloads
	- GitHub Actions
		- CI: typecheck + build
		- Deploy: build, SCP upload to VPS, npm ci, pm2 startOrReload, public /api/version verification
	- Nginx reverse proxy guidance in docs; version endpoint for diagnostics

- Testing & Tooling
	- PowerShell end‑to‑end script (scripts/test-demo.ps1) covering health, login, deposit, session start/end, operator insights
	- API smoke test (npm run smoke)

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

## B2B Basic Authentication (Sirplay → Kasyrooms)

Kasyrooms exposes B2B endpoints for Sirplay that require HTTP Basic Authentication.

- Required in production: set the following environment variables in `.env` (and in CI secrets):
	- `B2B_BASIC_AUTH_USER`
	- `B2B_BASIC_AUTH_PASS`
- In development: if not set, defaults are used (`sirplay`/`s3cr3t`) for local testing only.

Example request (curl):

```bash
curl -X POST http://localhost:5000/api/wallet/deposit \
	-H "Authorization: Basic $(printf '%s:%s' "$B2B_BASIC_AUTH_USER" "$B2B_BASIC_AUTH_PASS" | base64)" \
	-H "Content-Type: application/json" \
	-d '{"userId_A":"ext123","amount":10,"source":"sirplay","transactionId":"tx-001"}'
```

Protected B2B endpoints:

- `POST /api/user/register`
- `GET /api/wallet/balance`
- `POST /api/wallet/deposit`
- `POST /api/wallet/withdrawal`
- `POST /api/sso/token`
- `GET /api/sso/validate`

## Sirplay Integration

Endpoints and payloads used by the server for Sirplay flows.

- Handshake/Login: POST /api/sirplay/handshake and POST /api/sirplay/login
	- Body fields:
		- externalUserId: string (required)
		- email: string (required, valid email)
		- username: string (optional)
		- displayName: string (optional)
		- avatarUrl: string (optional, URL)
		- role: one of user|model|admin (optional; defaults to user)
	- Behavior: ensures local user and Sirplay account mapping; returns JWT token and user info.

- Webhook (Wallet): POST /api/webhooks/sirplay
	- HMAC verification:
		- Env vars:
			- SIRPLAY_WEBHOOK_SECRET: shared HMAC key (required)
			- SIRPLAY_WEBHOOK_SIGNATURE_HEADER: header name for signature (default: x-sirplay-signature)
			- SIRPLAY_WEBHOOK_TIMESTAMP_HEADER: header name for timestamp (default: x-sirplay-timestamp)
		- Signature is HMAC-SHA256 over `timestamp + "." + rawBody` (if timestamp provided) or `rawBody`.
		- Requests older than 5 minutes are rejected when timestamp header is present.
	- Body fields:
		- transactionId or ref: string (required; unique id for idempotency)
		- externalUserId: string (required)
		- email: string (required)
		- type: string (optional; e.g., deposit/withdrawal)
		- amountCents: number (preferred) or amount: number (will be multiplied by 100)
		- currency: string (optional; default EUR)
		- metadata: object (optional)
		- balanceCents: number (optional; snapshot upsert when provided)
	- Behavior: verifies HMAC, resolves/creates account by `externalUserId + email`, records idempotent transaction by `(provider, externalTransactionId)`, optionally upserts balance snapshot; returns `{ ok: true }` on success.

Note: If your actual webhook uses different field names, provide the exact payload so we can adapt `type`, `amountCents`/`amount`, and identity resolution.
