# Activity Monitoring System — Implementation Summary

## Overview

A comprehensive user activity monitoring system that tracks both authenticated users and anonymous visitors across onboarding flows and quiz interactions. All data is stored in PostgreSQL with role-based access control and GDPR-compliant data handling.

---

## Database Schema

### New Tables (Drizzle ORM)

| Table | Purpose |
|-------|---------|
| `activity_events` | Generic event log (onboarding_start, quiz_answer, login, etc.) |
| `onboarding_sessions` | Detailed onboarding session lifecycle tracking |
| `quiz_answer_logs` | Per-answer granular tracking with correctness and timing |
| `data_retention_policies` | Configurable auto-cleanup rules per table |

### Relationships

- `activity_events.userId` &rarr; `users.id` (nullable, set null on delete)
- `onboarding_sessions.userId` &rarr; `users.id` (nullable)
- `quiz_answer_logs.attemptId` &rarr; `quiz_attempts.id` (cascade delete)

---

## Tracking Coverage

### Onboarding Form (`OnboardingForm.tsx`)

| Event | Trigger |
|-------|---------|
| `onboarding_start` | Component mount (creates session token) |
| `onboarding_complete` | Successful form submission |
| `onboarding_abandon` | Component unmount without completion |

### Quiz Container (`QuizContainer.tsx`)

| Event | Trigger |
|-------|---------|
| `quiz_start` | Questions first shuffled (new session, not checkpoint restore) |
| `quiz_answer` | Every option selection (questionId, selectedIndex, isCorrect) |
| `quiz_complete` | Quiz submitted successfully |

---

## API Endpoints

### Public Tracking (no auth required)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/activity/track` | Generic event tracking |
| POST | `/api/activity/onboarding/start` | Start onboarding session |
| POST | `/api/activity/onboarding/complete` | Complete onboarding session |
| POST | `/api/activity/onboarding/abandon` | Mark onboarding as abandoned |
| POST | `/api/activity/quiz/answer` | Log individual quiz answer |

**Rate limit:** 60 requests/minute per IP.

### Batched Tracking (Recommended)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/activity/batch` | Ingest up to 100 batched events |

**Rate limit:** 10 batch requests/minute per IP.  
**Config:** batch size = 50, flush interval = 30s, max offline = 1000 events.

### Admin Monitoring (admin / super_admin only)

| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| GET | `/api/admin/activity/events` | admin+ | Query activity events with filters |
| GET | `/api/admin/activity/onboarding` | admin+ | Query onboarding sessions |
| GET | `/api/admin/activity/quiz-answers` | admin+ | Query quiz answer logs |
| GET | `/api/admin/activity/stats` | admin+ | Aggregated counts |
| POST | `/api/admin/activity/purge` | **super_admin only** | Run retention policy cleanup |
| DELETE | `/api/admin/activity` | **super_admin only** | Permanently delete ALL monitoring data |

---

## Access Control

- **View access:** `admin` and `super_admin` roles
- **Delete/Purge access:** `super_admin` only
- Enforced by `requireRole("admin", "super_admin")` middleware on all `/api/admin` routes
- Additional `requireSuperAdmin()` check on destructive operations

---

## Data Retention & GDPR Compliance

### Retention Policies (defaults)

| Table | Default Retention | Rationale |
|-------|-------------------|-----------|
| `activity_events` | 90 days | High-volume anonymous events |
| `onboarding_sessions` | 365 days | Lower volume, valuable funnel data |
| `quiz_answer_logs` | 365 days | Educational analytics |

### Privacy Features

1. **IP Anonymization:** Last octet removed before storage
2. **Payload Sanitization:** Passwords, tokens, secrets stripped from JSON payloads
3. **Right to Deletion:** Super admin can clear all monitoring data instantly
4. **No PII in Responses:** Admin API never returns raw IP addresses or user agents in bulk queries

---

## Admin Dashboard

New tab: **Activity Monitor** (`/admin/activity`)

### Features

- **Stats cards:** Total events, onboarding sessions, quiz answers
- **Onboarding funnel:** Visual completion/abandonment rates
- **Events table:** Filterable by event type
- **Onboarding table:** Filterable by status (started/completed/abandoned)
- **Quiz answers table:** Per-answer correctness and timing
- **Data management panel:** Purge expired (super_admin) / Clear all (super_admin)

---

## Deployment Steps

1. **Apply database schema:**
   ```bash
   npm run db:push
   # or
   npm run db:migrate
   ```

2. **Seed retention policies (run once):**
   The server automatically seeds default retention policies on first boot via `seedRetentionPolicies()` in the activity tracker service.

3. **Restart the backend:**
   ```bash
   npm run server
   ```

4. **Verify health endpoint:**
   ```bash
   curl http://localhost:4000/api/health
   ```

---

## Testing Plan

### Backend Tests

1. **Schema validation:** Verify all tables created successfully
2. **Tracking endpoints:**
   - POST `/api/activity/track` with valid/invalid event types
   - POST `/api/activity/onboarding/start` creates a session
   - POST `/api/activity/onboarding/complete` updates status
   - POST `/api/activity/quiz/answer` logs answer data
3. **Admin access control:**
   - Admin user can GET `/api/admin/activity/events`
   - Non-admin receives 403
   - Admin receives 403 on DELETE `/api/admin/activity`
   - Super admin can DELETE successfully
4. **Rate limiting:** Exceed 60 req/min and verify 429 response
5. **Data retention:** Insert old records, call purge, verify deletion

### Frontend Tests

1. **Onboarding tracking:**
   - Open onboarding form &rarr; verify `onboarding_start` event in DB
   - Submit form &rarr; verify `onboarding_complete` event
   - Navigate away without submitting &rarr; verify `onboarding_abandon` event
2. **Quiz tracking:**
   - Start quiz &rarr; verify `quiz_start` event
   - Answer a question &rarr; verify `quiz_answer` event with correct `isCorrect`
   - Finish quiz &rarr; verify `quiz_complete` event
3. **Admin dashboard:**
   - Activity Monitor tab loads with stats
   - Filter events by type
   - Filter onboarding by status
   - Super admin can purge/clear data with confirmation

---

## Files Added / Modified

| File | Action | Description |
|------|--------|-------------|
| `server/db/schema.ts` | Modified | Added 4 new tables with relations and types |
| `server/services/activityTracker.ts` | **New** | Core tracking service with queries and purge logic |
| `server/routes/activity.ts` | **New** | Public tracking endpoints |
| `server/routes/admin.ts` | Modified | Added 6 admin monitoring endpoints |
| `server/index.ts` | Modified | Registered `/api/activity` routes |
| `lib/api.ts` | Modified | Added client methods for tracking + admin queries |
| `lib/activityTracking.ts` | **New** | Client-side fire-and-forget tracking utilities |
| `components/feature/onboarding/OnboardingForm/OnboardingForm.tsx` | Modified | Integrated start/complete/abandon tracking |
| `components/feature/quiz/QuizContainer/QuizContainer.tsx` | Modified | Integrated start/answer/complete tracking |
| `components/feature/admin/tabs/ActivityMonitorTab.tsx` | **New** | Admin dashboard for viewing and managing data |
| `routes/admin/activityRoute.tsx` | **New** | Lazy-loaded route for Activity Monitor |
| `routes/admin/index.tsx` | Modified | Added activityRoute to children |
| `components/layout/AdminLayout/AdminLayout.tsx` | Modified | Added "activity" to navigation tabs |
| `locales/en.json` | Modified | Added activity monitor translations |
| `locales/id.json` | Modified | Added activity monitor translations (Indonesian) |
