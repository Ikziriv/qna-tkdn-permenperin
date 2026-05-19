# Railway Production Deployment Guide

## Prerequisites

1. Railway CLI installed (`npm i -g @railway/cli`)
2. Railway account connected
3. Database provisioned in Railway dashboard

## Environment Variables

Configure these in the Railway Project Settings → Variables panel:

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `JWT_SECRET` | Strong random secret for token signing | `openssl rand -hex 32` |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Server port | `4000` |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGIN` | `*` (dev) | Comma-separated allowed origins |
| `COOKIE_SECRET` | `JWT_SECRET` | Cookie signing secret |
| `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window |
| `RATE_LIMIT_MAX` | `100` | Max requests per window |
| `DB_POOL_MAX` | `10` | DB connection pool max |

### Frontend (build-time)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL (`/api` for proxy, full URL for prod) |

## Deploy Steps

### 1. Install production dependencies

```bash
npm install helmet compression
```

### 2. Build the frontend

```bash
npm run build
```

### 3. Deploy to Railway

```bash
railway login
railway link
railway up
```

### 4. Run database migrations

```bash
railway run npm run db:migrate
```

## Post-Deployment Verification

1. Check health endpoint: `GET /api/health`
2. Verify CORS headers are restricted (not wildcard)
3. Confirm `X-Frame-Options: DENY` on all responses
4. Test rate limiting returns 429 after threshold
5. Validate database connections are pooled correctly

## Rollback

```bash
railway rollback
```

## Monitoring

- Railway dashboard: CPU, memory, disk usage
- Application logs: `railway logs`
- Health checks: automatic via `/api/health`

## Security Checklist

- [ ] `JWT_SECRET` is unique and not the default
- [ ] `CORS_ORIGIN` is set to production domain only
- [ ] `NODE_ENV=production`
- [ ] Database has backups enabled
- [ ] No secrets committed to Git
