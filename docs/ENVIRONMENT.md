# Environment Configuration Guide

This document explains how environment variables are managed across local development, staging, and production deployments.

---

## File Separation

We use **two separate env file systems** to keep frontend and backend configs isolated:

| File | Consumed By | Purpose |
|------|------------|---------|
| `.env` | Express server (Node.js) | Backend secrets, DB URL, JWT keys, CORS, rate limits |
| `.env.development` | Vite dev server | Frontend API URL for local dev |
| `.env.production` | Vite build (`npm run build`) | Frontend API URL for production |
| `.env.example` | Documentation | Template showing all available variables |

**Never mix `VITE_*` variables into `.env`.** Vite only reads them from its own env files, and the backend should never see client-side config.

---

## Quick Start (Under 10 Minutes)

### 1. Clone & Install

```bash
git clone <repo-url>
cd qna-tkdn-permenperin
npm install
```

### 2. Backend Environment (`/.env`)

```bash
cp .env.example .env
```

Open `.env` and set at minimum:

```ini
DATABASE_URL=postgresql://user:password@localhost:5432/tkdn_quiz
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

### 3. Frontend Environment (already present)

The repo ships with:

- `.env.development` &rarr; `VITE_API_URL=/api` (uses Vite proxy)
- `.env.production` &rarr; `VITE_API_URL=https://qna-tkdn.up.railway.app/api`

No action needed unless you change domains.

### 4. Start Developing

Terminal 1 — Backend:

```bash
npm run server   # Express on http://localhost:4000
```

Terminal 2 — Frontend:

```bash
npm run dev      # Vite on http://localhost:3000
```

The Vite dev server proxies `/api` requests to `localhost:4000` automatically.

---

## Backend Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | `development`, `production`, `staging`, or `test` |
| `PORT` | No | `4000` | Express listen port |
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (must start with `postgresql://`) |
| `JWT_SECRET` | Prod only | `dev-jwt-secret-change-me` | Signing key for auth tokens; **min 32 chars** |
| `COOKIE_SECRET` | No | `JWT_SECRET` | Signing key for cookies |
| `CORS_ORIGIN` | Prod only | `true` (dev) / `[]` (prod) | Comma-separated allowed frontend origins |
| `RATE_LIMIT_WINDOW_MS` | No | `60000` | Rate-limit window in milliseconds |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window per IP |
| `DB_POOL_MAX` | No | `10` | Max DB connections in pool |

### Production Safety Gate

The server **will refuse to start** in `NODE_ENV=production` if:

- `JWT_SECRET` is missing or shorter than 32 characters
- `CORS_ORIGIN` is not set

This prevents accidental insecure deployments.

---

## Frontend Variables Reference

| Variable | File | Default | Description |
|----------|------|---------|-------------|
| `VITE_API_URL` | `.env.development` | `/api` | Backend base path during local dev (proxied) |
| `VITE_API_URL` | `.env.production` | `https://qna-tkdn.up.railway.app/api` | Absolute backend URL for production builds |

> **Note:** Only variables prefixed with `VITE_` are exposed to the browser. Never prefix secrets with `VITE_`.

---

## Cross-Environment Behavior

### Local Development

- **CORS**: `origin: true` (all origins allowed) — safe because traffic is localhost-only
- **Logging**: Verbose request logs with full paths
- **Error responses**: Detailed stack traces returned to client
- **Rate limits**: Standard 100 req / 60s window
- **Health check**: Includes memory usage, Node version, and platform

### Production / Staging

- **CORS**: Strict — only domains listed in `CORS_ORIGIN` can call the API
- **Logging**: Redacted auth paths; no sensitive data in logs
- **Error responses**: Sanitized generic messages (no stack traces)
- **Rate limits**: Same defaults, but stricter auth limits (10 req / 15 min per email)
- **Security headers**: HSTS, CSP (via Helmet), X-Frame-Options, etc.
- **Health check**: Basic info only (no memory diagnostics)

---

## Validation & Health Check

### Startup Validation

On boot, `server/config/env.ts` parses and validates every environment variable with [Zod](https://zod.dev). If anything is missing or malformed, the server prints a clear error list and exits with code `1`.

Example error output:

```
[ENV CONFIG ERROR] The server cannot start due to invalid or missing environment variables:
  - DATABASE_URL: DATABASE_URL is required
  - JWT_SECRET: JWT_SECRET is required in production. Generate a strong secret and set it as an environment variable.

Please review your .env file and ensure all required variables are set correctly.
```

### Health Endpoint

```bash
curl http://localhost:4000/api/health
```

Response (development):

```json
{
  "status": "ok",
  "timestamp": "2026-05-19T13:45:00.000Z",
  "uptime": 1247,
  "environment": {
    "nodeEnv": "development",
    "isProduction": false,
    "isDevelopment": true,
    "port": 4000,
    "rateLimitWindowMs": 60000,
    "rateLimitMax": 100,
    "dbPoolMax": 10,
    "corsOriginConfigured": false,
    "jwtSecretConfigured": true,
    "cookieSecretConfigured": false,
    "databaseUrlConfigured": true
  },
  "memory": { "rss": 67108864, "heapTotal": 23456789, "heapUsed": 12345678, "external": 4567890 },
  "nodeVersion": "v22.14.0",
  "platform": "win32"
}
```

Response (production) — diagnostics stripped:

```json
{
  "status": "ok",
  "timestamp": "2026-05-19T13:45:00.000Z",
  "uptime": 86400,
  "environment": {
    "nodeEnv": "production",
    "isProduction": true,
    ...
  }
}
```

---

## Security Checklist

- [ ] `JWT_SECRET` is at least 32 random characters in production
- [ ] `CORS_ORIGIN` is set to your exact frontend domain(s) in production
- [ ] `DATABASE_URL` uses SSL (`?sslmode=require` or `?sslmode=verify-full`)
- [ ] `.env` is listed in `.gitignore` and never committed
- [ ] `COOKIE_SECRET` is different from `JWT_SECRET` in production
- [ ] `NODE_ENV=production` is explicitly set on the production host

---

## Railway-Specific Notes

Railway injects environment variables directly into the container. Ensure these are set in the Railway dashboard:

| Railway Variable | Value |
|----------------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (auto-provisioned or copy from Xata/Neon) |
| `JWT_SECRET` | Generate once, paste into dashboard |
| `CORS_ORIGIN` | `https://qna-tkdn.up.railway.app` |
| `PORT` | (Railway overrides this automatically) |

The frontend build step (`npm run build`) reads `.env.production`, which already contains the correct production API URL.
