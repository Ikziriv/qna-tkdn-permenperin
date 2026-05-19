# Software Design Document (SDD)

## System: TKDN Compliance Navigator

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐ │
│  │  React App  │  │  Vite Build  │  │  Browser localStorage│ │
│  └──────┬──────┘  └──────────────┘  └─────────────────────┘ │
└─────────┼───────────────────────────────────────────────────┘
          │ HTTPS
┌─────────┼───────────────────────────────────────────────────┐
│         ▼                 Railway Platform                   │
│  ┌───────────────────────────────────────────────────────┐    │
│  │                  Express Server                      │    │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────┐  │    │
│  │  │  Auth   │ │  Quiz   │ │  Admin  │ │  Health  │  │    │
│  │  │ Routes  │ │ Routes  │ │ Routes  │ │  Check   │  │    │
│  │  └────┬────┘ └────┬────┘ └────┬────┘ └────┬─────┘  │    │
│  │       └─────────────┴──────────┴───────────┘         │    │
│  │                    Middleware                        │    │
│  │  (Auth, Rate Limit, CORS, Helmet, Error Handler)    │    │
│  └───────────────────────┬───────────────────────────────┘    │
│                          │                                   │
│  ┌───────────────────────▼───────────────────────────────┐    │
│  │              PostgreSQL (via pg Pool)               │    │
│  │         Drizzle ORM + Schema Definitions             │    │
│  └───────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend Framework | React | 19.2.4 | UI components, state management |
| Frontend Language | TypeScript | 5.8.2 | Type safety |
| Build Tool | Vite | 6.2.0 | Bundling, dev server, HMR |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| Routing | React Router DOM | 7.15.1 | Client-side routing |
| i18n | react-i18next | 17.0.8 | Localization |
| Charts | Recharts | 3.7.0 | Data visualization |
| Backend Framework | Express | 5.2.1 | REST API server |
| Backend Runtime | Node.js | 20+ | Server runtime |
| Database | PostgreSQL | 15+ | Relational data storage |
| ORM | Drizzle ORM | 0.45.2 | Type-safe SQL queries |
| Auth | JWT + bcrypt | 9.0.3 | Token-based authentication |

---

## 2. Component Design

### 2.1 Frontend Component Hierarchy

```
App.tsx (Application State Router)
├── AppLayout.tsx
│   ├── Navigation Header
│   │   ├── Branding
│   │   └── LanguageSwitcher
│   └── Main Content Area
│       ├── OnboardingView
│       ├── AuthForm
│       │   ├── LoginForm
│       │   └── RegisterForm
│       ├── QuizContainer
│       │   ├── ProgressBar (timer + percentage)
│       │   ├── QuestionCard
│       │   │   └── OptionList
│       │   ├── QuestionNavPad
│       │   ├── ConfirmationModal
│       │   ├── LoadingOverlay
│       │   └── ErrorOverlay
│       ├── ResultsContainer
│       │   ├── ScoreSummary
│       │   ├── CompetencyChart
│       │   ├── DetailedAnswers
│       │   └── ExportActions
│       └── AdminDashboard
│           ├── StatsCards
│           ├── ActivityChart
│           ├── UserTable
│           └── ReportBuilder
├── Modal.tsx (Primitive)
├── Spinner.tsx (Primitive)
├── Button.tsx (Primitive)
├── Card.tsx (Primitive)
├── Input.tsx (Primitive)
├── ProgressBar.tsx (Primitive)
└── Badge.tsx (Primitive)
```

### 2.2 Component Responsibilities

#### App.tsx
- **Role**: Root state router managing application lifecycle states
- **States**: `ONBOARDING`, `AUTH`, `QUIZ`, `RESULTS`, `ADMIN`
- **Responsibilities**:
  - Initialize authentication on mount (token refresh)
  - Route to appropriate view based on state
  - Handle global events (session expiry, logout)

#### QuizContainer.tsx
- **Role**: Core quiz orchestrator
- **State**: `currentQuestion`, `answers`, `timeRemaining`, `isSubmitting`, `showConfirmModal`
- **Responsibilities**:
  - Shuffle questions on quiz start
  - Manage answer selection and checkpoint persistence
  - Handle timer countdown and expiry
  - Coordinate submission flow (confirm → submit → redirect)

#### AuthForm.tsx
- **Role**: Authentication entry point
- **Props**: `onLogin`, `onBackToHome`
- **Responsibilities**:
  - Toggle between login/register modes
  - Validate form inputs
  - Communicate with auth API
  - Display error messages (sticky top-right)

---

## 3. State Management

### 3.1 Frontend State

#### Local Component State
| Component | State | Persistence |
|-----------|-------|-------------|
| QuizContainer | answers, currentQuestion | localStorage (`tkdn_quiz_checkpoint`) |
| QuizContainer | timeRemaining | localStorage (checkpoint) |
| AuthForm | form fields, errors | None (volatile) |
| ResultsContainer | filter, sort | None (volatile) |

#### Global Context
- **AuthProvider** (`contexts/AuthContext.tsx`)
  - `user`: Current authenticated user object
  - `isAuthenticated`: Boolean auth state
  - `login`, `logout`, `refresh`: Auth actions

- **AdminDataContext** (`contexts/AdminDataContext.tsx`)
  - `users`, `attempts`, `stats`: Admin dashboard data
  - `loading`, `error`: Fetch states

### 3.2 Backend State

#### Session Management
- Stateless JWT authentication (no server-side sessions)
- Access token: 15-minute expiry, stored in memory
- Refresh token: 7-day expiry, stored in database (`refresh_tokens` table)
- Token rotation on refresh to prevent replay attacks

---

## 4. Data Flow

### 4.1 Quiz Submission Flow

```
User clicks "Finish"
    │
    ▼
+---------------+
| Confirm Modal | ← Cancel closes modal
+-------+-------+
        │ OK
        ▼
+---------------+
| Loading Overlay| ← Min 1.2s display
| (Spinner)      |
+-------+-------+
        │
        ▼
+---------------+
| API: Submit   | ← POST /api/quiz/attempts/:id/complete
| Answers       |
+-------+-------+
        │ Success
        ▼
+---------------+
| Clear local   |
| checkpoint    |
+-------+-------+
        │
        ▼
+---------------+
| Redirect to   |
| Results       |
+---------------+
```

### 4.2 Authentication Flow

```
Login Request
    │
    ▼
+---------------+
| Validate      |
| Credentials   |
+-------+-------+
        │
        ▼
+---------------+
| Generate      |
| Access Token  |
+-------+-------+
        │
        ▼
+---------------+
| Generate      |
| Refresh Token |
| (DB + Cookie) |
+-------+-------+
        │
        ▼
+---------------+
| Return Tokens |
+---------------+
```

---

## 5. Database Design

### 5.1 Entity Relationship Diagram

```
┌─────────────┐       ┌─────────────────┐       ┌─────────────┐
│    users    │       │  quiz_attempts  │       │   quizzes   │
├─────────────┤       ├─────────────────┤       ├─────────────┤
│ id (PK)     │◄──────┤ id (PK)         │       │ id (PK)     │
│ email       │  1:N  │ user_id (FK)    │       │ title       │
│ passwordHash│       │ quiz_id (FK)    │──────►│ active      │
│ name        │       │ score           │  N:1  └─────────────┘
│ role        │       │ correctAnswers  │
│ isActive    │       │ timeSpentSeconds│
│ createdAt   │       │ completedAt     │
└─────────────┘       └─────────────────┘
                              │
                              │ 1:N
                              ▼
                       ┌─────────────────┐
                       │ quiz_responses  │
                       ├─────────────────┤
                       │ id (PK)         │
                       │ attempt_id (FK) │
                       │ questionId      │
                       │ selectedAnswer   │
                       │ isCorrect       │
                       └─────────────────┘

┌─────────────────┐       ┌─────────────────┐
│  refresh_tokens │       │   audit_logs    │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ id (PK)         │
│ user_id (FK)    │◄──────┤ user_id (FK)    │
│ tokenHash       │       │ action          │
│ expiresAt       │       │ resource        │
│ revokedAt       │       │ ip_address      │
└─────────────────┘       └─────────────────┘
```

### 5.2 Key Design Decisions
- **UUID vs Serial**: Integer serial PKs for performance; UUIDs considered for external APIs
- **Soft Deletes**: `isActive` flag on users; `revokedAt` on refresh tokens
- **Audit Logging**: Immutable audit log table with automatic IP/user agent capture

---

## 6. API Design

### 6.1 Endpoint Summary

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Create user account |
| POST | `/api/auth/login` | No | Authenticate and receive tokens |
| POST | `/api/auth/refresh` | No | Refresh access token |
| POST | `/api/auth/logout` | Yes | Revoke refresh token |
| POST | `/api/auth/logout-all` | Yes | Revoke all user tokens |
| GET | `/api/auth/me` | Yes | Get current user |
| GET | `/api/quiz/quizzes` | No | List active quizzes |
| POST | `/api/quiz/attempts` | Yes | Start new attempt |
| PATCH | `/api/quiz/attempts/:id/complete` | Yes | Complete attempt |
| POST | `/api/quiz/responses` | Yes | Save batch responses |
| GET | `/api/quiz/my-attempts` | Yes | List user attempts |
| GET | `/api/admin/stats` | Admin | Aggregate statistics |
| GET | `/api/admin/users` | Admin | List all users |
| GET | `/api/admin/attempts` | Admin | List all attempts |
| GET | `/api/health` | No | Health check |

### 6.2 Response Contract

All success responses:
```typescript
interface ApiResponse<T> {
  data: T;
}
```

All error responses:
```typescript
interface ApiError {
  error: string;
  retryAfter?: number; // For rate limit errors
}
```

---

## 7. Security Architecture

### 7.1 Threat Model

| Threat | Mitigation |
|--------|------------|
| SQL Injection | Drizzle ORM parameterized queries |
| XSS | Helmet CSP, output encoding, React auto-escaping |
| CSRF | SameSite cookies, stateless auth |
| Brute Force | Rate limiting on auth endpoints |
| Token Theft | Short access token expiry, refresh token rotation |
| Session Hijacking | IP logging in audit trail, secure cookie flags |

### 7.2 Authentication Sequence

```
Client                          Server
  │                               │
  ├─ POST /api/auth/login ─────►│
  │  {email, password}            │
  │                               │
  │◄──── {token, refreshToken} ──┤
  │                               │
  ├─ GET /api/quiz/attempts ───►│
  │  Authorization: Bearer <token>│
  │                               │
  │◄──── {attempts} ─────────────┤
  │                               │
  ├─ GET /api/auth/refresh ─────►│
  │  Cookie: refreshToken         │
  │                               │
  │◄──── {token} ────────────────┤
```

---

## 8. Deployment Architecture

### 8.1 Railway Platform Configuration

```
┌──────────────────────────────────────────┐
│           Railway Project                │
│  ┌────────────────────────────────────┐  │
│  │         Web Service                 │  │
│  │  ┌────────┐      ┌──────────────┐ │  │
│  │  │  API   │◄────►│  PostgreSQL  │ │  │
│  │  │ Server │      │  Database    │ │  │
│  │  └────────┘      └──────────────┘ │  │
│  │       │                           │  │
│  │  ┌────▼────┐                     │  │
│  │  │  Built  │                     │  │
│  │  │  Assets │                     │  │
│  │  └─────────┘                     │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### 8.2 Environment Strategy

| Environment | URL Pattern | DB | Purpose |
|-------------|-------------|-----|---------|
| Development | localhost:3000 | Local PostgreSQL | Feature development |
| Staging | *.railway.app | Railway PostgreSQL | Integration testing |
| Production | Custom domain | Railway PostgreSQL | Live users |

---

## 9. Error Handling Strategy

### 9.1 Frontend Error Boundaries
- Global error boundary at App level
- Component-specific boundaries for quiz and admin sections
- Fallback UI with retry option and error logging

### 9.2 Backend Error Handling
```
Request
  │
  ▼
[Validation] ──► 400 Bad Request
  │
  ▼
[Auth Check] ──► 401 Unauthorized / 403 Forbidden
  │
  ▼
[Business Logic]
  │
  ▼
[Database] ──► 500 with generic message (prod)
  │
  ▼
[Success] ──► 200/201 with data
```

---

## 10. Appendix

### A. File Structure
```
/
├── App.tsx                 # Root application router
├── index.tsx               # Entry point
├── vite.config.ts          # Build configuration
├── i18n.ts                 # Localization setup
├── lib/
│   └── api.ts              # API client with env-based URL
├── server/
│   ├── index.ts            # Express server entry
│   ├── config/env.ts       # Environment validation
│   ├── db/
│   │   ├── index.ts        # Database connection pool
│   │   └── schema.ts       # Drizzle schema definitions
│   ├── middleware/
│   │   ├── auth.ts         # JWT auth + token management
│   │   └── rateLimit.ts    # In-memory rate limiting
│   └── routes/
│       ├── auth.ts         # Authentication endpoints
│       ├── quiz.ts         # Quiz CRUD endpoints
│       ├── anonymousQuiz.ts # Anonymous quiz flow
│       └── admin.ts        # Admin dashboard endpoints
├── components/
│   ├── feature/            # Domain-specific components
│   │   ├── auth/
│   │   ├── quiz/
│   │   ├── results/
│   │   └── admin/
│   ├── layout/             # Shell components
│   └── ui/                 # Primitive components
├── contexts/               # React contexts
├── locales/                # Translation files (en, id)
└── types.ts                # Shared TypeScript types
```

### B. Related Documents
- `docs/BRD.md` — Business Requirements Document
- `docs/PRD.md` — Product Requirements Document
- `docs/TSD.md` — Technical Specification Document
