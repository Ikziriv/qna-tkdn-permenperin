# Technical Specification Document (TSD)

## System: TKDN Compliance Navigator

---

## 1. Technical Overview

### 1.1 Purpose
This document specifies the technical implementation details, coding standards, deployment procedures, and operational requirements for the TKDN Compliance Navigator application. It serves as the authoritative reference for developers and DevOps engineers.

### 1.2 Scope
- Frontend implementation standards (React + TypeScript)
- Backend API implementation (Express + Drizzle ORM)
- Database schema and migration procedures
- Environment configuration and secrets management
- Deployment pipeline to Railway
- Security hardening requirements
- Monitoring and observability

---

## 2. Development Environment

### 2.1 Prerequisites
| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | >=20.0.0 | Runtime |
| npm | >=10.0.0 | Package manager |
| PostgreSQL | >=15.0 | Local database |
| Git | >=2.40 | Version control |

### 2.2 Local Setup
```bash
# 1. Clone repository
git clone <repo-url>
cd qna-tkdn-permenperin

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your local database URL

# 4. Run database migrations
npm run db:migrate

# 5. Start development servers
npm run dev        # Frontend (Vite) on :3000
npm run server     # Backend (Express) on :4000
```

---

## 3. Frontend Technical Specifications

### 3.1 Technology Stack

| Concern | Technology | Version | Rationale |
|---------|-----------|---------|-----------|
| Framework | React | 19.2.4 | Concurrent features, modern patterns |
| Language | TypeScript | 5.8.2 | Type safety, IntelliSense, refactoring |
| Build Tool | Vite | 6.2.0 | Fast HMR, optimized builds, ESM native |
| Styling | Tailwind CSS | 3.x | Utility-first, design system consistency |
| Routing | React Router DOM | 7.15.1 | Declarative routing, data APIs |
| State | useState/useReducer + Context | — | Sufficient complexity; no Redux needed |
| i18n | react-i18next | 17.0.8 | Namespace support, lazy loading |
| Icons | Lucide React | latest | Tree-shakeable, accessible |
| Charts | Recharts | 3.7.0 | React-native, customizable |

### 3.2 Code Standards

#### File Naming
- Components: `PascalCase.tsx` (e.g., `QuizContainer.tsx`)
- Utilities/Hooks: `camelCase.ts` (e.g., `useAuth.ts`)
- Constants: `SCREAMING_SNAKE_CASE` (e.g., `DEFAULT_TIMER_SECONDS`)

#### Component Structure
```typescript
// 1. Imports (React, libraries, local, types)
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '@/lib/api';
import { QuizQuestion } from '@/types';

// 2. Constants
const TIMER_INTERVAL_MS = 1000;

// 3. Types (local only)
interface QuizContainerProps {
  questions: QuizQuestion[];
  onFinish: (answers: UserAnswer[], questions: QuizQuestion[]) => void;
}

// 4. Component
const QuizContainer: React.FC<QuizContainerProps> = ({ questions, onFinish }) => {
  // Hooks at top
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  
  // Effects next
  useEffect(() => { /* ... */ }, []);
  
  // Handlers
  const handleAnswer = (index: number) => { /* ... */ };
  
  // Derived state (useMemo for expensive computations)
  const progress = useMemo(() => /* ... */, [answers]);
  
  // Early returns AFTER all hooks
  if (questions.length === 0) return null;
  
  // Render
  return (
    <div className="space-y-6">
      {/* JSX */}
    </div>
  );
};

export default QuizContainer;
```

#### Hook Rules (Strict)
1. Hooks must be called at the top level of the function body
2. Hooks must be called in the same order on every render
3. No hooks after conditional returns (Rules of Hooks)
4. Custom hooks named `useXxx`

### 3.3 Styling Standards

#### Tailwind Usage
- **Utility-first**: No custom CSS files for components
- **Arbitrary values**: Only for one-off cases (e.g., `w-[7.5rem]`)
- **Custom config**: Extend `tailwind.config.js` for design tokens
- **Dark mode**: Not currently required; prepare with `dark:` prefix for future

#### Color Palette
| Token | Light Value | Usage |
|-------|-------------|-------|
| `slate-50` | `#f8fafc` | Page background |
| `slate-100` | `#f1f5f9` | Card backgrounds |
| `slate-400` | `#94a3b8` | Secondary text |
| `slate-600` | `#475569` | Body text |
| `slate-900` | `#0f172a` | Headings |
| `blue-600` | `#2563eb` | Primary actions |
| `blue-100` | `#dbeafe` | Primary light backgrounds |
| `red-500` | `#ef4444` | Timer urgent / errors |
| `amber-500` | `#f59e0b` | Timer warning |

### 3.4 Build Configuration

#### Vite Config (`vite.config.ts`)
```typescript
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    server: { port: 3000, host: '0.0.0.0', proxy: { '/api': 'http://localhost:4000' }},
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: { alias: { '@': path.resolve(__dirname, '.') }},
    build: {
      sourcemap: !isProd,
      cssMinify: isProd,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom', 'react-router-dom'],
            i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
            charts: ['recharts'],
          },
        },
      },
    },
  };
});
```

#### Output Artifacts
- `dist/` — Static build output (HTML, JS, CSS, assets)
- Assets include content hashes: `assets/index-[hash].js`
- `dist/` served by Express in production or deployed to CDN

---

## 4. Backend Technical Specifications

### 4.1 Technology Stack

| Concern | Technology | Version | Rationale |
|---------|-----------|---------|-----------|
| Runtime | Node.js | 20+ | LTS stability |
| Framework | Express | 5.2.1 | Minimal, middleware-rich |
| Language | TypeScript | 5.8.2 | Type safety |
| Loader | tsx | 4.22.1 | Zero-config TS execution |
| ORM | Drizzle ORM | 0.45.2 | Type-safe SQL, lightweight |
| Auth | JWT + bcrypt | 9.0.3 | Stateless, industry standard |
| Validation | Manual + Zod | — | Input validation on boundaries |
| Security | Helmet + custom | 7.1.0 | Security headers |
| Compression | compression | 1.7.4 | Response compression |

### 4.2 Server Entry (`server/index.ts`)

#### Middleware Order (Critical)
```
1. Helmet (security headers)
2. CORS (origin restriction)
3. express.json() (body parsing, 10kb limit)
4. cookieParser()
5. Request logging (with path redaction)
6. /api/health (before rate limits)
7. Rate limiting (global + auth-specific)
8. API routes
9. 404 handler
10. Global error handler
```

#### Graceful Shutdown
```typescript
function shutdown(signal: string) {
  console.log(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000); // Force after 10s
}
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
```

### 4.3 Environment Validation (`server/config/env.ts`)

#### Validation Rules
```typescript
const REQUIRED_PROD = ["DATABASE_URL", "JWT_SECRET"];
const REQUIRED_ALL = ["DATABASE_URL"];

function validate() {
  const toCheck = IS_PRODUCTION ? REQUIRED_PROD : REQUIRED_ALL;
  const missing = toCheck.filter(k => !process.env[k]?.trim());
  if (missing.length > 0) {
    throw new Error(
      `[ENV ERROR] Missing required environment variables: ${missing.join(", ")}`
    );
  }
}
```

#### Exported Constants
| Constant | Source | Default |
|----------|--------|---------|
| `API_URL` | `import.meta.env.VITE_API_URL` | `"/api"` |
| `PORT` | `process.env.PORT` | `4000` |
| `DATABASE_URL` | `process.env.DATABASE_URL` | — (required) |
| `JWT_SECRET` | `process.env.JWT_SECRET` | — (required in prod) |
| `CORS_ORIGIN` | `process.env.CORS_ORIGIN` | `true` (dev) / `[]` (prod) |
| `RATE_LIMIT_MAX` | `process.env.RATE_LIMIT_MAX` | `100` |
| `DB_POOL_MAX` | `process.env.DB_POOL_MAX` | `10` |

### 4.4 Database (`server/db/`)

#### Connection Pool
```typescript
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: DB_POOL_MAX,           // 10
  ssl: IS_PRODUCTION ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,   // Close idle connections after 30s
  connectionTimeoutMillis: 5000, // Fail after 5s
});
```

#### Schema Patterns
- All tables use `serial` primary keys
- Timestamps: `createdAt`, `updatedAt` where applicable
- Soft deletes: `isActive` (users), `revokedAt` (tokens)
- Foreign keys with `onDelete`/`onUpdate` constraints

#### Migration Procedure
```bash
# Generate migration from schema changes
npm run db:generate

# Apply migrations
npm run db:migrate

# Seed data (development only)
npm run db:seed

# Reset (development only)
npm run db:reset
```

### 4.5 Authentication (`server/middleware/auth.ts`)

#### JWT Configuration
| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Access Token Expiry | 15 minutes | Short-lived, reduced blast radius |
| Refresh Token Expiry | 7 days | Convenience vs. security balance |
| Algorithm | HS256 | Symmetric, server-only secret |
| Secret Source | `JWT_SECRET` env var | No hardcoded fallbacks |

#### Token Storage
- **Access Token**: Memory only (React state)
- **Refresh Token**: HttpOnly Secure SameSite=Strict cookie + database hash

#### Refresh Token Rotation
```
1. Client sends refresh request with cookie
2. Server validates token hash against DB
3. Server revokes old token (sets revokedAt)
4. Server generates new access + refresh tokens
5. Server returns new access token, sets new refresh cookie
```

### 4.6 Rate Limiting (`server/middleware/rateLimit.ts`)

#### Implementation
- **Store**: In-memory Map (resets on server restart)
- **Key**: `ip:method:path` or custom generator
- **Window**: Sliding window (entry.resetAt)

#### Configuration
| Endpoint | Window | Max | Key Generator |
|----------|--------|-----|---------------|
| Global API | 60s | 100 | `ip:method:path` |
| `/api/auth/register` | 15min | 10 | `ip:email` |
| `/api/auth/login` | 15min | 10 | `ip:email` |

---

## 5. API Technical Specifications

### 5.1 Request/Response Format

#### Headers
```
Content-Type: application/json
Authorization: Bearer <access_token>
```

#### Success Response
```json
{
  "data": { /* payload */ }
}
```

#### Error Response
```json
{
  "error": "Human-readable message",
  "retryAfter": 60  // Optional, for rate limits
}
```

### 5.2 Endpoint Details

#### POST /api/auth/register
**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Validation:**
- Email: valid format, unique
- Password: >=8 chars, 1 uppercase, 1 lowercase, 1 number
- Name: 2-100 chars

**Response:**
```json
{
  "data": {
    "user": { "id": 1, "email": "user@example.com", "name": "John Doe" },
    "token": "access.jwt.token",
    "refreshToken": "refresh.jwt.token"
  }
}
```

#### POST /api/quiz/attempts/:id/complete
**Request:**
```json
{
  "score": 85,
  "correctAnswers": 17,
  "timeSpentSeconds": 1420
}
```

**Response:**
```json
{
  "data": {
    "attempt": { "id": 1, "score": 85, "completedAt": "2026-05-19T10:30:00Z" }
  }
}
```

---

## 6. Security Technical Specifications

### 6.1 CORS Configuration

#### Development
```typescript
{ origin: true, credentials: true }  // Allow all (localhost only)
```

#### Production
```typescript
{ origin: ["https://app.yourdomain.com"], credentials: true }
```

### 6.2 Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `X-XSS-Protection` | `1; mode=block` | Legacy XSS protection |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limit referrer leakage |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | Disable unused APIs |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Force HTTPS |
| `Content-Security-Policy` | (Helmet default) | Prevent XSS, data injection |

### 6.3 Cookie Configuration
```typescript
res.cookie("refreshToken", token, {
  httpOnly: true,
  secure: IS_PRODUCTION,      // HTTPS only in production
  sameSite: "strict",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

---

## 7. Deployment Specifications

### 7.1 Railway Configuration (`railway.toml`)

```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm run server"
healthcheckPath = "/api/health"
healthcheckTimeout = 30
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 3

[environments.production.deploy]
numReplicas = 1
```

### 7.2 Build Pipeline

```
Local Dev          Git Push         Railway Build         Deploy
   │                  │                  │                  │
   │  npm run dev     │   git push       │  nixpacks build  │  health check
   │────────►         │────────►         │────────►         │────────►
   │  :3000 + :4000   │  main branch     │  npm install     │  /api/health
   │                  │                  │  npm run build   │  port 4000
```

### 7.3 Environment Variables (Railway Dashboard)

**Required:**
- `DATABASE_URL` — Railway auto-provides if using Railway Postgres
- `JWT_SECRET` — Generate: `openssl rand -hex 32`
- `NODE_ENV=production`
- `PORT=4000`

**Recommended:**
- `CORS_ORIGIN=https://your-domain.com`
- `RATE_LIMIT_MAX=100`
- `DB_POOL_MAX=10`

### 7.4 Pre-Deploy Checklist
- [ ] TypeScript compiles: `npx tsc --noEmit`
- [ ] ESLint passes: `npm run lint`
- [ ] Frontend builds: `npm run build`
- [ ] Migrations prepared: `npm run db:generate`
- [ ] `.env` secrets not committed
- [ ] Health endpoint responds locally

---

## 8. Monitoring & Logging

### 8.1 Health Check
```
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2026-05-19T10:30:00.000Z"
}
```

### 8.2 Request Logging Format
```
[2026-05-19T10:30:00.000Z] GET /api/quiz/quizzes 200 45ms
[2026-05-19T10:30:05.000Z] POST /api/auth/[REDACTED] 200 120ms
```

### 8.3 Error Logging
```typescript
console.error("[ERROR]", err);
// In production: sends to logging service (Sentry, Datadog)
```

### 8.4 Railway Monitoring
- CPU/Memory/Disk: Railway dashboard
- Logs: `railway logs` or dashboard stream
- Uptime: Health check endpoint
- Alerts: Configure in Railway dashboard

---

## 9. Testing Strategy

### 9.1 Frontend Testing
| Type | Tool | Coverage |
|------|------|----------|
| Unit | Vitest | Components, utilities, hooks |
| Integration | React Testing Library | User flows, form submissions |
| E2E | Playwright | Critical paths (quiz, auth, results) |

### 9.2 Backend Testing
| Type | Tool | Coverage |
|------|------|----------|
| Unit | Vitest | Middleware, utilities |
| Integration | Supertest | API endpoints |
| Security | OWASP ZAP | Vulnerability scan |

### 9.3 Load Testing
| Tool | Target | Metric |
|------|--------|--------|
| k6 | `/api/quiz/quizzes` | 100 RPS, p95 < 200ms |
| k6 | `/api/auth/login` | 10 RPS, no 429s below threshold |

---

## 10. Appendix

### A. TypeScript Configuration
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["node", "vite/client"],
    "moduleResolution": "bundler",
    "isolatedModules": true,
    "jsx": "react-jsx",
    "paths": { "@/*": ["./*"] },
    "allowImportingTsExtensions": true,
    "noEmit": true
  }
}
```

### B. ESLint Configuration
- Extends: `@typescript-eslint/recommended`, `react-hooks/recommended`
- Rules: `react-hooks/rules-of-hooks`: `error`

### C. Related Documents
- `docs/BRD.md` — Business Requirements Document
- `docs/PRD.md` — Product Requirements Document
- `docs/SDD.md` — Software Design Document
- `RAILWAY.md` — Deployment Guide
