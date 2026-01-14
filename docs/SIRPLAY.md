# Sirplay Integration

This project includes a reusable Sirplay HTTP client and normalized routes. Use the following environment variables to configure Sirplay.

## Required environment

Set these in your `.env` or environment before running:

- Core API:
  - `SIRPLAY_BASE_URL`: Base URL of Sirplay API (e.g., https://proxykasynoir.kasynoir.com)
  - `SIRPLAY_SIGNUP_BASE_PATH`: Signup base path (default `/user-account/signup`)
  - `SIRPLAY_WALLET_BASE_PATH`: Wallet base path (default `/wallet`)
- Access credentials:
  - `SIRPLAY_ACCESS_USER`: Integration username
  - `SIRPLAY_ACCESS_PASS`: Integration password
- Partner and wallet:
  - `SIRPLAY_PARTNER_ID`: Partner id used on wallet ops
  - `SIRPLAY_WALLET_PASSPORT` (optional): Passport header required by wallet (if provided by Sirplay)
- B2B Basic Auth (Sirplay → Kasyrooms):
  - `B2B_BASIC_AUTH_USER`, `B2B_BASIC_AUTH_PASS` (required in production)
  - Alternatively `SIRPLAY_B2B_USER`, `SIRPLAY_B2B_PASSWORD`
- Webhook HMAC verification:
  - `SIRPLAY_WEBHOOK_SECRET` (required)
  - `SIRPLAY_WEBHOOK_SIGNATURE_HEADER` (default `x-sirplay-signature`)
  - `SIRPLAY_WEBHOOK_TIMESTAMP_HEADER` (default `x-sirplay-timestamp`)
  - Ensure raw body capture in Express: `express.json({ verify: (req, _res, buf) => { req.rawBody = buf; } })`

## Useful scripts (optional)

- Smoke outbound create/update:

```bash
npm run smoke:sirplay:outbound
```

- Adapter outbound focused test:

```bash
npm run test:sirplay:adapter:outbound
```

If required env vars are missing, these scripts will fail or be skipped. Configure vars first.

## Files of interest
- Client: `server/services/sirplayClient.ts`
- Outbound helpers (adapter/test tooling): `server/services/sirplayUsers.ts`
- Adapter facades (internal mapping): `server/services/sirplayAdapter.ts`
- Routes: `server/routes.ts`
- Smoke script: `server/scripts/smoke-sirplay-outbound.ts`
- Test: `tests/sirplay-adapter-outbound.ts`

## Admin Endpoints Usage

These endpoints require an admin JWT (`requireRole(['admin'])`). Obtain a token via the demo login:

```bash
curl -sS -X POST http://127.0.0.1:5000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin"}'
```

Export the `jwt` value returned as `JWT` for convenience.

### Outbound User Register (Operator → Sirplay)

```bash
curl -sS -X POST http://127.0.0.1:5000/api/sirplay/out/user/register \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{
    "userId_B":"u-001",
    "password":"ChangeMe123!",
    "status":"ACTIVE",
    "name":"Mario",
    "surname":"Rossi",
    "email":"mario.rossi@example.com",
    "mobilePhone":"+391234567890"
  }'
```

### Outbound User Update (Operator → Sirplay)

```bash
curl -sS -X PUT http://127.0.0.1:5000/api/sirplay/out/user/update \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{
    "userId_B":"u-001",
    "action":"USER_UPDATE",
    "status":"ACTIVE",
    "email":"mario.rossi+updated@example.com"
  }'
```

### Wallet: GET from Sirplay

```bash
curl -sS -X GET "http://127.0.0.1:5000/api/sirplay/out/wallet?sirplayUserId=SIRPLAY_USER_ID" \
  -H "Authorization: Bearer $JWT"
```

### Wallet: Deposit to Sirplay

```bash
curl -sS -X POST http://127.0.0.1:5000/api/sirplay/out/wallet/deposit \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{
    "sirplayUserId":"SIRPLAY_USER_ID",
    "idTransaction":"tx-20260105-001",
    "amount":25.00,
    "currency":"EUR",
    "description":"External deposit"
  }'
```

### Wallet: Withdrawal from Sirplay

```bash
curl -sS -X POST http://127.0.0.1:5000/api/sirplay/out/wallet/withdrawal \
  -H "Authorization: Bearer $JWT" \
  -H 'Content-Type: application/json' \
  -d '{
    "sirplayUserId":"SIRPLAY_USER_ID",
    "idTransaction":"tx-20260105-002",
    "amount":10.00,
    "currency":"EUR",
    "description":"External withdrawal"
  }'
```

## Inbound Endpoints (Sirplay → Kasyrooms)

These are the endpoints that Sirplay calls into Kasyrooms. Use them to validate the integration quickly.

### REGISTER (Bearer)

Path: `/user-account/signup/b2b/registrations`

```bash
# Bearer token is format-only for local tests (no introspection)
curl -sS -X POST http://127.0.0.1:5000/user-account/signup/b2b/registrations \
  -H 'Authorization: Bearer SIRPLAY_TEST_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "eventId": "8b9a3d7f-1111-2222-3333-444455556666",
    "operation": "REGISTER",
    "action": "USER_REGISTRATION",
    "eventTime": 1736070000000,
    "userData": {
      "userId": "SIRPLAY-USER-ID",
      "userName": "sirplay_user_001",
      "email": "user@example.com",
      "name": "Mario",
      "surname": "Rossi",
      "birthDate": "1990-01-01",
      "mobilePhone": "+390000000000",
      "created": "2026-01-05T12:00:00Z",
      "lastUpdated": null
    }
  }'
```

Expected response (exact):

```json
{
  "status": "success",
  "userData": {
    "userName": "sirplay_user_001",
    "externalId": "SIRPLAY-USER-ID",
    "password": null,
    "name": "Mario",
    "surname": "Rossi",
    "email": "user@example.com",
    "status": "ACTIVE",
    "birthDate": "1990-01-01",
    "lastUpdated": null,
    "created": "2026-01-05T12:00:00.000Z",
    "mobilePhone": "+390000000000",
    "profileType": "PLAYER"
  }
}
```

Notes:
- `externalId` is generated by Kasyrooms and equals `userData.userId` from Sirplay.
- Sirplay must store the `externalId` from this response for subsequent calls.

### UPDATE (Basic Auth)

Path: `/user-account/signup/b2b/registrations`

```bash
# Provide B2B basic auth credentials (configure in env)
curl -sS -X PUT http://127.0.0.1:5000/user-account/signup/b2b/registrations \
  -u "$B2B_BASIC_AUTH_USER:$B2B_BASIC_AUTH_PASS" \
  -H 'Content-Type: application/json' \
  -d '{
    "eventId": "0f3e9e21-aaaa-bbbb-cccc-ddddeeeeffff",
    "operation": "UPDATE",
    "action": "USER_UPDATE",
    "eventTime": 1736073600000,
    "userData": {
      "externalId": "ext-001",
      "email": "user+updated@example.com",
      "name": "Mario",
      "surname": "Rossi",
      "mobilePhone": "+390000000001",
      "birthDate": "1990-01-01",
      "lastUpdated": "2026-01-05T13:00:00Z"
    }
  }'
```

Expected response:

```json
{
  "status": "UPDATED",
  "externalUserId": "ext-001"
}
```

### B2B Login Tokens (Basic Auth)

Path: `/api/b2b/login-tokens`

Request body:

```json
{ "externalId": "SIRPLAY-USER-ID" }
```

Response:

```json
{
  "status": "success",
  "loginToken": "<opaque-token>",
  "accessLink": "https://<base-url>?token=<opaque-token>"
}
```
