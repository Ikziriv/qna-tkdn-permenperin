# TKDN & BMP Compliance Navigator — Technical Documentation

## 1. Project Overview

A regulatory readiness tool designed to help industrial stakeholders evaluate their understanding of **Permenperin No. 35 Year 2025** regarding **TKDN (Tingkat Komponen Dalam Negeri)** and **BMP (Bobot Manfaat Perusahaan)** certification.

- **Frontend**: React 19, Vite, TypeScript, Recharts, TailwindCSS
- **Backend**: Express 5, TypeScript, Drizzle ORM
- **Database**: PostgreSQL
- **AI Integration**: Google Gemini API
- **Authentication**: JWT (access + refresh tokens), bcrypt, TOTP MFA, role-based access control
- **Localization**: Bahasa Indonesia & English

---

## 2. System Architecture

### 2.1 High-Level Flow

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Browser   │──────│  Vite (dev)  │──────│  Express    │
│  (React 19) │      │   Port 3000  │      │  Port 4000  │
└─────────────┘      └──────────────┘      └──────┬──────┘
                                                    │
                                              ┌─────┴─────┐
                                              │ PostgreSQL│
                                              └───────────┘
```

- **Development**: Vite dev server proxies `/api` to Express on `localhost:4000`
- **Production**: Static build served from `dist/`; Express API server runs independently

### 2.2 Directory Structure

```
qna-tkdn-permenperin/
├── assets/                  # Static assets (PDFs, JSON data sources)
├── components/              # React components
│   ├── AdminDashboard.tsx   # Admin analytics & user management
│   ├── Auth.tsx             # Login / Register / MFA
│   ├── Layout.tsx           # App shell & navigation
│   ├── Onboarding.tsx       # Quiz start form
│   ├── Quiz.tsx             # Interactive quiz interface
│   ├── Results.tsx          # Score breakdown & printable report
│   ├── QuizHistory.tsx      # User attempt history
│   └── ResumeModal.tsx      # Session recovery prompt
├── lib/
│   └── api.ts               # Centralized fetch client with token refresh
├── server/
│   ├── index.ts             # Express app entry point
│   ├── db/
│   │   ├── index.ts         # Drizzle database connection
│   │   ├── schema.ts        # PostgreSQL schema definitions
│   │   ├── migrate.ts       # Database migration runner
│   │   ├── seed.ts          # Quiz & admin seeding
│   │   ├── reset.ts         # Full database reset
│   │   ├── make-admin.ts    # CLI: promote user to admin
│   │   └── make-super-admin.ts
│   ├── middleware/
│   │   ├── auth.ts          # JWT verification, token generation, audit logging
│   │   └── rateLimit.ts     # API rate limiting
│   └── routes/
│       ├── auth.ts          # Register, login, refresh, logout, MFA
│       ├── quiz.ts          # Authenticated quiz attempts & responses
│       ├── anonymousQuiz.ts # Anonymous quiz sessions
│       └── admin.ts         # Admin-only stats & management
├── services/
│   └── geminiService.ts     # Google Gemini AI integration
├── types.ts                 # Shared TypeScript interfaces
├── constants.ts             # Static quiz questions (25 Qs)
├── translations.ts          # i18n strings (EN / ID)
├── App.tsx                  # Root component & state machine
└── vite.config.ts           # Vite + proxy configuration
```

---

## 3. Database Schema

Managed by **Drizzle ORM** with PostgreSQL.

| Table | Purpose |
|---|---|
| `users` | Registered accounts with roles (`user` / `admin` / `super_admin`), MFA secrets |
| `refresh_tokens` | Rotating refresh tokens for JWT sessions |
| `quizzes` | Quiz definitions (title, description, category, active flag) |
| `quiz_attempts` | Per-user quiz sessions with scores & timing |
| `quiz_responses` | Individual question responses per attempt |
| `anonymous_attempts` | Guest quiz sessions linkable to accounts later |
| `audit_logs` | Security & compliance audit trail |

### Key Relationships
- `users` → `quiz_attempts` (one-to-many)
- `users` → `refresh_tokens` (one-to-many)
- `quiz_attempts` → `quiz_responses` (one-to-many)
- `users` → `anonymous_attempts` (one-to-many, via `linkedUserId`)

---

## 4. Authentication & Security

### 4.1 JWT Token Flow
1. **Login** → server issues short-lived `accessToken` + long-lived `refreshToken`
2. **API Calls** → `accessToken` sent in `Authorization: Bearer` header
3. **401 Response** → client auto-refreshes via `/auth/refresh` using `refreshToken`
4. **Refresh Rotation** → old refresh token revoked, new pair issued
5. **Logout** → refresh token revoked server-side; client clears storage

### 4.2 Multi-Factor Authentication (MOTP/TOTP)
- Custom TOTP implementation (Base32 secret, SHA1, 30s window, ±1 drift)
- Setup endpoint generates `otpauth://` URI for authenticator apps
- Verify endpoint enables MFA; disable endpoint requires valid code

### 4.3 Role-Based Access Control (RBAC)
| Role | Permissions |
|---|---|
| `user` | Take quizzes, view own history |
| `admin` | View admin dashboard, stats, attempts, leaderboard |
| `super_admin` | All admin perms + change user roles |

### 4.4 Audit Logging
Every auth event (register, login, logout, MFA, token refresh) is logged to `audit_logs` with:
- `userId`, `action`, `resource`, `ipAddress`, `userAgent`, `details`

---

## 5. API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | No | Create account |
| POST | `/login` | No | Authenticate; returns MFA challenge if enabled |
| POST | `/refresh` | No | Rotate tokens |
| POST | `/logout` | No | Revoke refresh token |
| POST | `/logout-all` | Yes | Revoke all user refresh tokens |
| GET | `/me` | Yes | Get current user profile |
| POST | `/mfa/setup` | Yes | Generate TOTP secret |
| POST | `/mfa/verify` | Yes | Enable MFA with code |
| POST | `/mfa/disable` | Yes | Disable MFA with code |

### Quiz (`/api/quiz`)
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/quizzes` | Yes | List quizzes |
| POST | `/attempts` | Yes | Start a quiz attempt |
| PATCH | `/attempts/:id/complete` | Yes | Finish & score attempt |
| POST | `/responses` | Yes | Save question responses |
| GET | `/my-attempts` | Yes | User history |
| GET | `/my-progress` | Yes | User progress stats |
| GET | `/attempts/:id/responses` | Yes | Detailed attempt review |
| GET | `/export` | Yes | Export user data |
| POST | `/anonymous/start` | No | Start anonymous attempt |
| PATCH | `/anonymous/:token/complete` | No | Finish anonymous attempt |
| GET | `/anonymous/:token/preview` | No | Preview anonymous results |
| POST | `/anonymous/:token/link` | Yes | Link anonymous to logged-in user |

### Admin (`/api/admin`)
| Method | Endpoint | Role | Description |
|---|---|---|---|
| GET | `/stats` | admin+ | Platform-wide statistics |
| GET | `/attempts` | admin+ | All quiz attempts |
| GET | `/users` | admin+ | All registered users |
| PATCH | `/users/:id/role` | super_admin | Update user role |
| GET | `/leaderboard` | admin+ | Top performers |
| GET | `/daily-activity` | admin+ | Attempts per day |

---

## 6. Frontend State Machine

Managed in `App.tsx` via the `AppState` enum:

```
ONBOARDING → QUIZ → RESULTS → (HISTORY / AUTH / ADMIN)
     ↑_________________________|
```

- **Session Persistence**: Quiz progress, answers, and profile are stored in `localStorage`
- **Resume Modal**: On login, returning users are prompted to resume or restart
- **Anonymous Flow**: Unauthenticated users can complete quizzes; results link to account upon registration/login

---

## 7. Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for signing JWTs |
| `PORT` | No | Express server port (default: 4000) |
| `GEMINI_API_KEY` | Yes* | Google Gemini API key for AI features |

> *Only required if AI features are enabled.

---

## 8. Build & Deployment

### Development
```bash
# Terminal 1 — Frontend
npm run dev              # Vite on http://localhost:3000

# Terminal 2 — Backend
npm run server           # Express on http://localhost:4000
```

### Database Setup
```bash
npm run db:generate      # Generate Drizzle migrations
npm run db:migrate       # Run migrations
npm run db:seed          # Seed quizzes & default data
npm run db:studio        # Drizzle Studio GUI
```

### Production Build
```bash
npm run build            # Vite builds to dist/
```

---

## 9. Production Readiness Checklist & Recommendations

### 9.1 Infrastructure
- [ ] **Separate API & Static Hosting**: Deploy the Express backend to a Node.js host (Railway, Render, Fly.io, AWS EC2/ECS) and the Vite static build to a CDN (Vercel, Netlify, CloudFront, or Nginx).
- [ ] **Reverse Proxy**: Use Nginx or Caddy in front of Express for TLS termination, compression, and static file serving.
- [ ] **Database Hosting**: Move from Xata to a managed PostgreSQL instance (Supabase, AWS RDS, Railway Postgres) with automated backups and connection pooling (PgBouncer).
- [ ] **Environment Isolation**: Maintain distinct `.env` files for `development`, `staging`, and `production`. Never commit secrets.

### 9.2 Security Hardening
- [ ] **HTTPS Only**: Enforce TLS 1.2+ on all endpoints. Set `Secure; HttpOnly; SameSite=Strict` cookies if switching to cookie-based auth.
- [ ] **CORS Restriction**: Replace `cors({ origin: true })` with explicit allowed origins in production.
- [ ] **Helmet.js**: Add `helmet` middleware to Express for security headers (CSP, HSTS, X-Frame-Options).
- [ ] **Rate Limiting**: The existing `rateLimit.ts` is good; ensure Redis-backed rate limiting for multi-instance deployments.
- [ ] **Input Validation**: Add `zod` validation on all request bodies to prevent injection and malformed data.
- [ ] **Secrets Management**: Rotate `JWT_SECRET` and `GEMINI_API_KEY` regularly. Use a secrets manager (AWS Secrets Manager, Doppler, 1Password Secrets Automation).
- [ ] **Password Policy**: Enforce minimum length (12+), complexity, and breach-checking (Have I Been Pwned API).

### 9.3 Observability & Reliability
- [ ] **Structured Logging**: Replace `console.error` with a structured logger (Pino / Winston) and aggregate logs (Datadog, Logtail, CloudWatch).
- [ ] **Error Tracking**: Integrate Sentry for frontend & backend crash reporting.
- [ ] **Health Checks**: The `/api/health` endpoint exists; add DB connectivity and dependency checks.
- [ ] **Monitoring**: Track API latency, DB query performance, and quiz completion rates (Prometheus + Grafana or hosted APM).
- [ ] **Alerting**: Configure alerts for 5xx spikes, DB connection exhaustion, and disk usage.

### 9.4 Performance
- [ ] **Database Indexing**: Add indexes on `users.email`, `quiz_attempts.user_id`, `quiz_attempts.completed_at`, `anonymous_attempts.session_token`, and `audit_logs.user_id`.
- [ ] **Query Optimization**: Use Drizzle's `with` relations or raw SQL for heavy admin aggregation queries.
- [ ] **Frontend Bundle**: Audit bundle size with `vite-bundle-visualizer`. Code-split heavy components (`AdminDashboard`, `Results`).
- [ ] **Caching**: Add Redis caching for quiz data, leaderboard, and stats to reduce DB load.
- [ ] **CDN**: Serve static assets (fonts, images, JS/CSS bundles) from a CDN with long cache headers.

### 9.5 Data & Compliance
- [ ] **GDPR / PDP Compliance**: Implement data export (`/export`) and account deletion endpoints. Add a privacy policy and cookie consent.
- [ ] **Backup Strategy**: Automated daily PostgreSQL backups with point-in-time recovery (PITR).
- [ ] **Data Retention**: Define and implement retention policies for `audit_logs` and `anonymous_attempts`.
- [ ] **Quiz Content Versioning**: Store quiz questions in the database (not just `constants.ts`) to allow non-code updates and A/B testing.

### 9.6 Feature Enhancements for Production
- [ ] **Email System**: Add transactional email (Resend, SendGrid) for registration verification and password reset.
- [ ] **Admin CLI Tooling**: Expand `make-admin.ts` into a proper CLI (`tsx cli.ts promote-user --email=...`).
- [ ] **CI/CD Pipeline**: GitHub Actions workflow for lint → test → build → deploy.
- [ ] **E2E Testing**: Add Playwright tests covering login, quiz flow, and admin dashboard.
- [ ] **Unit Testing**: Add Vitest for frontend components and Supertest for API routes.

---

## 10. Quick Reference Commands

```bash
# Setup
npm install

# Development (run both in separate terminals)
npm run dev       # Vite frontend
npm run server    # Express backend

# Database
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:reset
npm run db:studio

# Production build
npm run build
npm run preview

# Admin utilities
npx tsx server/db/make-admin.ts <email>
npx tsx server/db/make-super-admin.ts <email>
```
