/**
 * Public Activity Tracking Routes
 *
 * Endpoints for recording user interactions from the frontend.
 * These are intentionally lightweight and do NOT require authentication
 * so that anonymous visitor behavior can also be tracked.
 *
 * Rate limiting is applied to prevent abuse.
 */

import { Router, Request, Response } from "express";
import {
  trackEvent,
  trackEventsBatch,
  startOnboardingSession,
  completeOnboardingSession,
  abandonOnboardingSession,
  logQuizAnswer,
} from "../services/activityTracker";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

/* ── Rate Limiting ─────────────────────────────────────────────────── */

const trackLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 tracking events per minute per IP
  message: "Tracking rate limit exceeded. Please slow down.",
});

/* ── Helpers ─────────────────────────────────────────────────────── */

function getClientInfo(req: Request) {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    undefined;
  const userAgent = req.headers["user-agent"] || undefined;
  return { ipAddress: ip, userAgent };
}

/* ── Generic Event Tracking ────────────────────────────────────────── */

router.post("/track", trackLimiter, async (req: Request, res: Response) => {
  try {
    const { eventType, userId, sessionId, payload } = req.body;

    const validEventTypes: string[] = [
      "onboarding_start", "onboarding_complete", "onboarding_abandon",
      "quiz_start", "quiz_answer", "quiz_complete", "quiz_abandon",
      "page_view", "login", "logout", "register",
    ];
    if (!eventType || typeof eventType !== "string" || !validEventTypes.includes(eventType)) {
      res.status(400).json({ error: "eventType is required and must be a valid event type." });
      return;
    }

    const { ipAddress, userAgent } = getClientInfo(req);

    const id = await trackEvent({
      eventType: eventType as import("../services/activityTracker").EventType,
      userId: userId ? Number(userId) : null,
      sessionId: sessionId || undefined,
      payload,
      ipAddress,
      userAgent,
    });

    res.json({ success: true, id });
  } catch (error) {
    console.error("[ACTIVITY] track error:", error);
    res.status(500).json({ error: "Failed to track event." });
  }
});

/* ── Onboarding Session Tracking ──────────────────────────────────── */

router.post(
  "/onboarding/start",
  trackLimiter,
  async (req: Request, res: Response) => {
    try {
      const { sessionToken, userId, name, role } = req.body;

      if (!sessionToken || typeof sessionToken !== "string") {
        res.status(400).json({ error: "sessionToken is required." });
        return;
      }

      const { ipAddress, userAgent } = getClientInfo(req);

      const id = await startOnboardingSession({
        sessionToken,
        userId: userId ? Number(userId) : null,
        name,
        role,
        ipAddress,
        userAgent,
      });

      res.json({ success: true, id });
    } catch (error) {
      console.error("[ACTIVITY] onboarding start error:", error);
      res.status(500).json({ error: "Failed to start onboarding session." });
    }
  }
);

router.post(
  "/onboarding/complete",
  trackLimiter,
  async (req: Request, res: Response) => {
    try {
      const { sessionToken, name, role, stepProgress } = req.body;

      if (!sessionToken) {
        res.status(400).json({ error: "sessionToken is required." });
        return;
      }

      await completeOnboardingSession(sessionToken, { name, role, stepProgress });
      res.json({ success: true });
    } catch (error) {
      console.error("[ACTIVITY] onboarding complete error:", error);
      res.status(500).json({ error: "Failed to complete onboarding session." });
    }
  }
);

router.post(
  "/onboarding/abandon",
  trackLimiter,
  async (req: Request, res: Response) => {
    try {
      const { sessionToken, stepProgress } = req.body;

      if (!sessionToken) {
        res.status(400).json({ error: "sessionToken is required." });
        return;
      }

      await abandonOnboardingSession(sessionToken, stepProgress);
      res.json({ success: true });
    } catch (error) {
      console.error("[ACTIVITY] onboarding abandon error:", error);
      res.status(500).json({ error: "Failed to abandon onboarding session." });
    }
  }
);

/* ── Quiz Answer Tracking ─────────────────────────────────────────── */

router.post(
  "/quiz/answer",
  trackLimiter,
  async (req: Request, res: Response) => {
    try {
      const {
        attemptId,
        sessionToken,
        questionId,
        selectedAnswerIndex,
        isCorrect,
        timeSpentSeconds,
      } = req.body;

      if (
        questionId === undefined ||
        selectedAnswerIndex === undefined ||
        isCorrect === undefined
      ) {
        res.status(400).json({
          error: "questionId, selectedAnswerIndex, and isCorrect are required.",
        });
        return;
      }

      const { ipAddress, userAgent } = getClientInfo(req);

      const id = await logQuizAnswer({
        attemptId: attemptId ? Number(attemptId) : null,
        sessionToken: sessionToken || undefined,
        questionId: Number(questionId),
        selectedAnswerIndex: Number(selectedAnswerIndex),
        isCorrect: Boolean(isCorrect),
        timeSpentSeconds: timeSpentSeconds ? Number(timeSpentSeconds) : undefined,
        ipAddress,
        userAgent,
      });

      res.json({ success: true, id });
    } catch (error) {
      console.error("[ACTIVITY] quiz answer error:", error);
      res.status(500).json({ error: "Failed to log quiz answer." });
    }
  }
);

/* ── Batch Event Tracking ────────────────────────────────────────── */

const batchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 batch requests per minute per IP (each batch = up to 50 events)
  message: "Batch tracking rate limit exceeded. Please slow down.",
});

router.post("/batch", batchLimiter, async (req: Request, res: Response) => {
  try {
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      res.status(400).json({ error: "events must be a non-empty array." });
      return;
    }

    if (events.length > 100) {
      res.status(400).json({ error: "Batch size cannot exceed 100 events." });
      return;
    }

    const validEventTypes: string[] = [
      "onboarding_start", "onboarding_complete", "onboarding_abandon",
      "quiz_start", "quiz_answer", "quiz_complete", "quiz_abandon",
      "page_view", "login", "logout", "register",
    ];

    const { ipAddress, userAgent } = getClientInfo(req);

    const ids = await trackEventsBatch(
      events.map((e: any) => ({
        eventType: validEventTypes.includes(e.eventType) ? e.eventType : "page_view",
        userId: e.userId ? Number(e.userId) : null,
        sessionId: e.sessionId || undefined,
        payload: e.payload,
        ipAddress,
        userAgent,
        // Client may send enriched metadata
        screenWidth: e.screenWidth,
        screenHeight: e.screenHeight,
        url: e.url,
        referrer: e.referrer,
      })),
      validEventTypes
    );

    res.json({ success: true, count: ids.length });
  } catch (error) {
    console.error("[ACTIVITY] batch error:", error);
    res.status(500).json({ error: "Failed to process batch." });
  }
});

export default router;
