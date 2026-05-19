# Business Requirements Document (BRD)

## Project: TKDN Compliance Navigator

---

## 1. Executive Summary

### 1.1 Purpose
TKDN Compliance Navigator is a web-based interactive evaluation platform designed to assess and improve user understanding of TKDN (Tingkat Kandungan Dalam Negeri) regulations as defined in Permenperin regulations. The application provides gamified quiz experiences, detailed compliance reporting, and administrative analytics.

### 1.2 Business Objectives
- **Objective 1**: Provide accessible regulatory compliance education through interactive assessment
- **Objective 2**: Generate detailed compliance reports for users to identify knowledge gaps
- **Objective 3**: Offer administrative oversight with user management, analytics, and reporting tools
- **Objective 4**: Support both authenticated users and anonymous quiz participants
- **Objective 5**: Ensure regulatory content accuracy and alignment with current Permenperin standards

### 1.3 Success Metrics
- **User Engagement**: >80% quiz completion rate
- **Knowledge Improvement**: Average score increase of >20% on retake attempts
- **Platform Uptime**: 99.9% availability during business hours
- **Performance**: Page load <2s, API response <500ms
- **Accessibility**: WCAG 2.1 AA compliance

---

## 2. Stakeholder Requirements

### 2.1 Primary Stakeholders
| Stakeholder | Role | Key Requirements |
|-------------|------|-----------------|
| End Users | Quiz participants | Intuitive interface, clear feedback, progress tracking, accessible design |
| Administrators | Platform managers | User management, analytics dashboard, report generation, content moderation |
| Compliance Officers | Content owners | Accurate regulatory content, audit trails, secure data handling |
| IT Operations | Infrastructure | Automated deployment, monitoring, rollback capabilities |

### 2.2 Stakeholder Needs Analysis
- End users need a low-friction entry path (anonymous or registered) with persistent progress
- Administrators require real-time dashboards with exportable data
- Compliance officers need confidence in content accuracy and data integrity
- Operations team needs Railway-compatible deployment with health checks and graceful scaling

---

## 3. Functional Requirements

### 3.1 User Authentication & Authorization
- **FR-1.1**: Users can register with email, password, and name
- **FR-1.2**: Registered users can log in with email and password
- **FR-1.3**: Multi-factor authentication (MFA) setup and verification support
- **FR-1.4**: Role-based access control (user, admin, super-admin)
- **FR-1.5**: Session management with JWT access tokens and refresh token rotation
- **FR-1.6**: Account lockout and audit logging for security events

### 3.2 Quiz Engine
- **FR-2.1**: Randomized question presentation from predefined question banks
- **FR-2.2**: Multiple-choice single-select answer format
- **FR-2.3**: Real-time progress tracking with visual progress bar
- **FR-2.4**: Question navigation pad with answered/unanswered/current state indicators
- **FR-2.5**: 30-minute default timer with visual countdown and color-coded urgency
- **FR-2.6**: Timer persistence across page refreshes via localStorage
- **FR-2.7**: Automatic quiz submission when timer expires
- **FR-2.8**: Confirmation dialog before final submission with OK/Cancel options

### 3.3 Results & Reporting
- **FR-3.1**: Immediate score calculation upon submission
- **FR-3.2**: Categorized competency breakdown (e.g., regulatory knowledge areas)
- **FR-3.3**: Visual charts showing performance distribution
- **FR-3.4**: PDF export of compliance summary report
- **FR-3.5**: Detailed per-question review with correct/incorrect indicators
- **FR-3.6**: Anonymous quiz results shareable via generated token links

### 3.4 Administration
- **FR-4.1**: Admin dashboard with user statistics, attempt counts, average scores
- **FR-4.2**: User management (view, update role, deactivate, delete)
- **FR-4.3**: Quiz attempt history and response review
- **FR-4.4**: Leaderboard and daily activity visualization
- **FR-4.5**: Custom report generation with name, format, and parameter selection
- **FR-4.6**: Report download with access logging

### 3.5 Localization
- **FR-5.1**: Full UI internationalization (i18n) support
- **FR-5.2**: Indonesian (default) and English language support
- **FR-5.3**: Language preference persistence in localStorage
- **FR-5.4**: RTL/layout considerations for future language expansion

---

## 4. Non-Functional Requirements

### 4.1 Performance
- **NFR-1.1**: Initial page load < 2 seconds on 3G connection
- **NFR-1.2**: API response latency < 500ms (p95)
- **NFR-1.3**: Database query execution < 100ms for standard operations
- **NFR-1.4**: Support 100+ concurrent users without performance degradation

### 4.2 Security
- **NFR-2.1**: All API endpoints enforce HTTPS in production
- **NFR-2.2**: Passwords hashed with bcrypt (cost factor 10+)
- **NFR-2.3**: JWT tokens with short expiry (15 minutes access, 7 days refresh)
- **NFR-2.4**: Rate limiting: 100 req/min global, 10 auth attempts per 15 minutes
- **NFR-2.5**: SQL injection prevention via parameterized queries (Drizzle ORM)
- **NFR-2.6**: XSS mitigation via Content Security Policy and output encoding
- **NFR-2.7**: CSRF protection for state-changing operations
- **NFR-2.8**: Secure cookie attributes (HttpOnly, Secure, SameSite=Strict)

### 4.3 Scalability
- **NFR-3.1**: Database connection pooling (max 10 connections)
- **NFR-3.2**: Stateless API design for horizontal scaling
- **NFR-3.3**: Asset caching with content-hash filenames for cache invalidation
- **NFR-3.4**: Code splitting for reduced initial bundle size

### 4.4 Reliability
- **NFR-4.1**: 99.9% uptime SLA
- **NFR-4.2**: Graceful degradation when external services fail
- **NFR-4.3**: Database backup and restore procedures documented
- **NFR-4.4**: Automated health checks at `/api/health`

### 4.5 Accessibility
- **NFR-5.1**: WCAG 2.1 Level AA compliance
- **NFR-5.2**: Keyboard navigation for all interactive elements
- **NFR-5.3**: Screen reader support with ARIA labels and live regions
- **NFR-5.4**: Focus management in modal dialogs
- **NFR-5.5**: Color contrast ratio >= 4.5:1 for normal text

### 4.6 Maintainability
- **NFR-6.1**: TypeScript strict mode enabled
- **NFR-6.2**: ESLint configuration for code quality
- **NFR-6.3**: Component-based architecture with clear separation of concerns
- **NFR-6.4**: Environment-based configuration (no hardcoded secrets)

---

## 5. Constraints & Assumptions

### 5.1 Constraints
- Target platform: Railway (PaaS)
- Database: PostgreSQL (via Xata or Railway-managed)
- Frontend framework: React 19 + TypeScript
- Backend framework: Express 5 + TypeScript
- Build tool: Vite 6
- ORM: Drizzle ORM

### 5.2 Assumptions
- Users have modern browsers supporting ES2022
- Network connectivity is available during quiz sessions
- Regulatory content is provided by domain experts and updated periodically
- Railway infrastructure provides automatic SSL certificate provisioning

---

## 6. Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Database connection pool exhaustion | Medium | High | Connection limits, query optimization, monitoring |
| JWT secret compromise | Low | Critical | Strong secret generation, rotation procedures, env var security |
| Regulatory content inaccuracy | Medium | High | Content review workflow, version control, expert validation |
| Performance degradation under load | Medium | High | Rate limiting, caching, horizontal scaling readiness |
| Data loss | Low | Critical | Automated backups, restore testing, audit logging |

---

## 7. Approval

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Product Owner | | | |
| Technical Lead | | | |
| Compliance Officer | | | |
