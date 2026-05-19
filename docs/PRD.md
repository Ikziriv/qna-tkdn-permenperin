# Product Requirements Document (PRD)

## Product: TKDN Compliance Navigator

---

## 1. Product Overview

### 1.1 Product Vision
An intuitive, accessible, and reliable web application that empowers users to evaluate and improve their understanding of TKDN (Domestic Content Level) regulatory compliance through interactive assessments, personalized feedback, and comprehensive reporting.

### 1.2 Target Users
- **Primary**: Regulatory compliance professionals and auditors seeking to validate knowledge
- **Secondary**: Students and trainees learning TKDN regulations
- **Tertiary**: Platform administrators managing users, content, and analytics

### 1.3 Product Goals
1. Reduce time-to-competency for TKDN regulatory understanding by 40%
2. Achieve >75% user satisfaction score (measured via post-quiz feedback)
3. Support seamless onboarding with both guest and registered user flows
4. Provide actionable insights through detailed performance analytics

---

## 2. User Stories

### 2.1 End User (Quiz Participant)

**US-1: Onboarding**
> As a first-time visitor, I want to see an informative landing page so that I understand the platform's purpose before starting an evaluation.

**US-2: Anonymous Quiz**
> As a visitor, I want to take a quiz without creating an account so that I can quickly assess my knowledge.

**US-3: Account Registration**
> As a visitor, I want to register with my email and name so that I can save my progress and access historical results.

**US-4: Login**
> As a registered user, I want to log in securely so that I can access my personalized dashboard and past attempts.

**US-5: Quiz Timer**
> As a quiz taker, I want to see a countdown timer so that I can pace myself during the assessment.

**US-6: Question Navigation**
> As a quiz taker, I want to jump between questions using a navigation pad so that I can review and change my answers efficiently.

**US-7: Submission Confirmation**
> As a quiz taker, I want a confirmation dialog before final submission so that I don't accidentally submit incomplete work.

**US-8: Results Dashboard**
> As a quiz taker, I want to see my score, competency breakdown, and detailed answer review so that I understand my strengths and weaknesses.

**US-9: Report Export**
> As a quiz taker, I want to download my results as a PDF so that I can share or archive my performance record.

**US-10: Language Preference**
> As an Indonesian user, I want the interface in Bahasa Indonesia by default so that I can use the platform comfortably.

### 2.2 Administrator

**US-11: Dashboard Overview**
> As an admin, I want to see aggregate statistics (total users, attempts, average scores) so that I can monitor platform engagement.

**US-12: User Management**
> As an admin, I want to view, filter, and manage user accounts so that I can maintain platform integrity.

**US-13: Attempt Analytics**
> As an admin, I want to view detailed quiz attempt data so that I can identify trends and content gaps.

**US-14: Report Generation**
> As an admin, I want to generate and download custom reports so that I can share insights with stakeholders.

---

## 3. Functional Specifications

### 3.1 Quiz Flow

```
[Onboarding] → [Start Quiz] → [Answer Questions] → [Review] → [Confirm Submit] → [Processing] → [Results]
```

#### 3.1.1 Question Presentation
- Questions displayed one at a time with 4 multiple-choice options
- Options labeled A, B, C, D (localized)
- Selected option visually highlighted
- Current question number and total shown in header

#### 3.1.2 Timer Behavior
- Default duration: 30 minutes (1,800 seconds)
- Visual display: `MM:SS` format with color states:
  - Green/blue: >5 minutes remaining
  - Orange: <=5 minutes remaining
  - Red: <=1 minute remaining
- Persisted to localStorage every 10 seconds
- Auto-submission when timer reaches 00:00
- Timer hidden on onboarding and results pages

#### 3.1.3 Confirmation Dialog
- Triggered when user clicks "Finish" on last question
- Modal title: "Confirm Submission" (localized)
- Description: "Are you sure about all the answers you have filled in?"
- Actions:
  - **OK**: Proceed to submission, show loading overlay
  - **Cancel**: Close modal, return to quiz
  - **Escape key**: Close modal (return to quiz)
- Backdrop click disabled to prevent accidental dismissal

#### 3.1.4 Loading & Submission
- Spinner displayed with message: "Processing quiz..." (or "Time's Up!" if timer expired)
- Minimum display duration: 1.2 seconds to prevent visual flash
- Error state: Retry button with error message if submission fails
- Success: Redirect to results page

### 3.2 Results Page

| Section | Content |
|---------|---------|
| Score Summary | Overall percentage, correct/incorrect counts |
| Competency Graph | Radar/bar chart showing performance by regulation area |
| Detailed Answers | Per-question breakdown with correct answer highlighted |
| Actions | Retake quiz, export PDF, share (if anonymous) |

### 3.3 Admin Dashboard

| Widget | Data |
|--------|------|
| Stats Cards | Total users, total attempts, avg score, completion rate |
| Daily Activity | Line chart of attempts over last 7/30 days |
| Leaderboard | Top performers table |
| Recent Attempts | Paginated list with user, score, date, duration |

---

## 4. UI/UX Requirements

### 4.1 Design Principles
- **Clarity**: Every action has a clear label and expected outcome
- **Feedback**: Visual and textual confirmation for all state changes
- **Accessibility**: Keyboard-navigable, screen-reader friendly, high contrast
- **Responsiveness**: Mobile-first layout that scales to desktop

### 4.2 Component Library
| Component | Purpose |
|-----------|---------|
| Modal | Confirmation dialogs, overlays |
| Spinner | Loading states |
| ProgressBar | Quiz completion, timer urgency |
| QuestionNavPad | Question grid navigation |
| Card | Content containers |
| Badge | Status indicators (answered/unanswered) |
| Button | Primary, secondary, ghost variants |

### 4.3 Animation Specifications
- Page transitions: fade-in + slide-from-bottom (800ms ease-out)
- Modal open/close: 200ms fade with backdrop blur
- Button interactions: 150ms scale transform (active: 0.98)
- Timer color transitions: 300ms ease
- Loading overlay: 300ms fade-in

### 4.4 Responsive Breakpoints
| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Mobile | <640px | Stacked layout, full-width buttons, hidden nav elements |
| Tablet | 640-1024px | Side-by-side columns, condensed padding |
| Desktop | >1024px | Max-width containers, expanded spacing |

---

## 5. Technical Requirements

### 5.1 Frontend Stack
- **Framework**: React 19 (functional components + hooks)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS with custom color tokens
- **Routing**: React Router v7 (state-based in App.tsx)
- **State**: Local state + localStorage persistence
- **Icons**: Lucide React (consistent, accessible)
- **Charts**: Recharts
- **Build**: Vite 6 with code splitting

### 5.2 Backend Stack
- **Runtime**: Node.js with tsx
- **Framework**: Express 5
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: JWT (access + refresh tokens), bcrypt
- **Validation**: Runtime input validation on all endpoints
- **Security**: Helmet, CORS restriction, rate limiting

### 5.3 API Requirements
All endpoints return JSON with consistent structure:
```json
{
  "data": {},
  "error": null
}
```

Error responses:
```json
{
  "error": "Human-readable message",
  "retryAfter": 60
}
```

---

## 6. Release Criteria

### 6.1 MVP (Phase 1)
- [x] Anonymous quiz flow
- [x] Timer with persistence
- [x] Confirmation dialog + loading state
- [x] Results page with basic metrics
- [x] User registration and login
- [x] Indonesian/English localization

### 6.2 Phase 2
- [ ] Admin dashboard
- [ ] PDF report export
- [ ] User attempt history
- [ ] MFA support

### 6.3 Phase 3
- [ ] Custom report builder
- [ ] Leaderboard
- [ ] Advanced analytics
- [ ] Content management system

---

## 7. Metrics & Analytics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Quiz Completion Rate | >80% | (Completed / Started) * 100 |
| Average Score | >60% | Sum of scores / total attempts |
| Time on Platform | >5 min | Average session duration |
| Return Rate | >30% | Users with 2+ attempts / total users |
| NPS Score | >50 | Post-results survey |

---

## 8. Appendix

### A. Glossary
- **TKDN**: Tingkat Kandungan Dalam Negeri (Domestic Content Level)
- **Permenperin**: Peraturan Menteri Perindustrian (Minister of Industry Regulation)
- **MFA**: Multi-Factor Authentication

### B. Reference Documents
- `docs/BRD.md` — Business Requirements Document
- `docs/SDD.md` — Software Design Document
- `docs/TSD.md` — Technical Specification Document
