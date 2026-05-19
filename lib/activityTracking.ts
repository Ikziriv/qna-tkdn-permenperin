/**
 * Client-side Activity Tracking Utilities (Batch-Optimized)
 *
 * All tracking events are routed through the batch tracker to minimize
 * API traffic. Critical events (quiz_complete, onboarding_complete) are
 * still guaranteed delivery via the batch tracker's retry + offline queue.
 */

import { trackEvent, flush } from "./activityBatchTracker";

function generateSessionToken(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function getUserId(): number | null {
  try {
    const userStr = localStorage.getItem("tkdn_user");
    if (userStr) {
      const user = JSON.parse(userStr);
      return user?.id || null;
    }
  } catch {
    // ignore
  }
  return null;
}

/* ── Onboarding Tracking ──────────────────────────────────────────── */

export function startOnboardingTracking(name?: string, role?: string): string {
  const sessionToken = generateSessionToken();
  localStorage.setItem("tkdn_onboarding_session", sessionToken);

  trackEvent({
    eventType: "onboarding_start",
    userId: getUserId(),
    sessionId: sessionToken,
    payload: { name, role },
  });

  return sessionToken;
}

export function completeOnboardingTracking(name: string, role: string): void {
  const sessionToken = localStorage.getItem("tkdn_onboarding_session");
  if (!sessionToken) return;

  trackEvent({
    eventType: "onboarding_complete",
    userId: getUserId(),
    sessionId: sessionToken,
    payload: { name, role },
  });
  localStorage.removeItem("tkdn_onboarding_session");
  flush();
}

export function abandonOnboardingTracking(): void {
  const sessionToken = localStorage.getItem("tkdn_onboarding_session");
  if (!sessionToken) return;

  trackEvent({
    eventType: "onboarding_abandon",
    userId: getUserId(),
    sessionId: sessionToken,
  });
  localStorage.removeItem("tkdn_onboarding_session");
  flush();
}

/* ── Quiz Tracking ────────────────────────────────────────────────── */

export function startQuizTracking(): void {
  trackEvent({
    eventType: "quiz_start",
    userId: getUserId(),
    sessionId: getSessionId(),
  });
}

export function logQuizAnswerTracking(
  questionId: number,
  selectedAnswerIndex: number,
  isCorrect: boolean,
  timeSpentSeconds?: number
): void {
  trackEvent({
    eventType: "quiz_answer",
    userId: getUserId(),
    sessionId: getSessionId(),
    payload: { questionId, selectedAnswerIndex, isCorrect, timeSpentSeconds },
  });
}

export function completeQuizTracking(): void {
  trackEvent({
    eventType: "quiz_complete",
    userId: getUserId(),
    sessionId: getSessionId(),
  });
  flush();
}

/* ── Session Helpers ──────────────────────────────────────────────── */

function getSessionId(): string | undefined {
  return localStorage.getItem("tkdn_quiz_session") || undefined;
}

export function setQuizSessionId(id: string): void {
  localStorage.setItem("tkdn_quiz_session", id);
}

/* ── Manual flush for page unload ───────────────────────────────── */

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    flush();
  });
}
