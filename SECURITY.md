# Security Guide

## Pre-Deployment Security Checklist

Run through this checklist before every production deployment.

### Environment Variables

- [ ] `NODE_ENV` is set to `production`
- [ ] `JWT_SECRET` is a unique, cryptographically random string (min 32 hex chars)
- [ ] `DATABASE_URL` uses SSL and is not the development local database
- [ ] `CORS_ORIGIN` is set to the exact production domain(s) — no wildcards
- [ ] `PORT` is set (Railway usually injects this automatically)
- [ ] No `.env` files containing secrets are committed to Git
- [ ] `VITE_API_URL` in production build points to the production API domain

### Database Security

- [ ] Connection pool limit (`DB_POOL_MAX`) is configured for Railway's resources
- [ ] SSL is enabled for PostgreSQL connections (`ssl: { rejectUnauthorized: false }`)
- [ ] Database credentials are not hardcoded in source code
- [ ] Database backups are enabled in Railway dashboard

### Authentication & Authorization

- [ ] JWT access tokens expire in 15 minutes or less
- [ ] Refresh tokens are stored as HttpOnly Secure SameSite=Strict cookies
- [ ] Password hashes use bcrypt with cost factor >= 10
- [ ] Rate limiting is active on `/api/auth/register` and `/api/auth/login`
- [ ] Admin routes require both authentication AND role verification
- [ ] Audit logging captures security-relevant events (login, logout, role changes)

### API Security

- [ ] Helmet middleware is active (security headers present on all responses)
- [ ] Response compression is enabled in production
- [ ] CORS preflight requests are properly handled
- [ ] Global rate limiting returns 429 with `Retry-After` header
- [ ] All API endpoints return consistent error responses (no stack traces in production)
- [ ] Input validation rejects oversized payloads (`express.json({ limit: "10kb" })`)

### Headers Verification

Confirm these headers are present on API responses:

```bash
curl -I https://your-domain.com/api/health
```

Expected headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

### Frontend Security

- [ ] Production build does not include source maps (`sourcemap: false`)
- [ ] API base URL is configured via environment variable (`VITE_API_URL`)
- [ ] No API keys or secrets are embedded in frontend bundle
- [ ] localStorage keys use app-specific prefix (`tkdn_`)

### Dependency Audit

```bash
npm audit --audit-level=moderate
```

- [ ] No critical or high vulnerabilities in production dependencies
- [ ] Known dev-dependency vulnerabilities are documented and accepted

### Current Known Vulnerabilities (Dev Dependencies)

| Package | Severity | Path | Risk Assessment |
|---------|----------|------|-----------------|
| esbuild | Moderate | drizzle-kit → @esbuild-kit → esbuild | Dev-only; affects build-time only, not runtime |

These are acceptable for development but should be monitored.

---

## Incident Response

### Suspected JWT Secret Compromise
1. Immediately rotate `JWT_SECRET` environment variable
2. Revoke all refresh tokens: `UPDATE refresh_tokens SET revoked_at = NOW()`
3. Force all users to re-authenticate
4. Review audit logs for unauthorized access

### Database Connection Pool Exhaustion
1. Check Railway metrics for connection count
2. Restart application ( Railway dashboard → Restart )
3. Review `DB_POOL_MAX` setting and query performance
4. Enable connection logging if needed

### Rate Limit Bypass Attempt
1. Check logs for repeated 429 responses from same IP
2. Consider lowering `RATE_LIMIT_MAX` temporarily
3. Block IP at Railway level if necessary
4. Review whether endpoint is being abused by bots

---

## Security Scan Commands

### Manual Verification

```bash
# 1. Check headers
curl -I https://your-domain.com/api/health

# 2. Verify CORS restriction
curl -H "Origin: https://evil.com" -I https://your-domain.com/api/health
# Expected: No Access-Control-Allow-Origin header

# 3. Test rate limiting
for i in {1..15}; do curl -s -o /dev/null -w "%{http_code}\n" https://your-domain.com/api/auth/login; done
# Expected: First 10 return 200, rest return 429

# 4. Verify no stack traces in production errors
curl https://your-domain.com/api/nonexistent
# Expected: Generic error message, no file paths or stack traces
```

---

## Contact

For security issues, contact: [your-security-email@domain.com]
