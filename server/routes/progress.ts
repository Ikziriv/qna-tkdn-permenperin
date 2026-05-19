/**
 * Progress Routes — Final Submission & Verification
 *
 * Endpoints for persisting only fully completed quiz submissions.
 * Rejects partial progress; all valid submissions are atomic.
 */

import { Router, Request, Response } from "express";
import {
  submitAuthenticatedFinal,
  submitAnonymousFinal,
  verifyAuthenticatedSubmission,
  verifyAnonymousSubmission,
} from "../services/progressService";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

/* ── Rate Limiting ─────────────────────────────────────────────────── */

const finalSubmissionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 final submissions per minute per IP
  message: "Submission rate limit exceeded. Please slow down.",
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

/* ── Authenticated Final Submission ────────────────────────────── */

router.post(
  "/final",
  authenticateToken,
  finalSubmissionLimiter,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user!.id;
      const {
        quizId,
        totalQuestions,
        score,
        correctAnswers,
        timeSpentSeconds,
        responses,
      } = req.body;

      if (!quizId || !totalQuestions || score === undefined || correctAnswers === undefined) {
        res.status(400).json({ error: "quizId, totalQuestions, score, and correctAnswers are required." });
        return;
      }

      const result = await submitAuthenticatedFinal({
        userId,
        quizId: Number(quizId),
        totalQuestions: Number(totalQuestions),
        score: Number(score),
        correctAnswers: Number(correctAnswers),
        timeSpentSeconds: timeSpentSeconds ? Number(timeSpentSeconds) : undefined,
        responses,
      });

      res.status(201).json({
        success: true,
        attemptId: result.attemptId,
        verified: true,
      });
    } catch (error: any) {
      console.error("[PROGRESS] Final submission error:", error);
      const status = error.message?.includes("Incomplete submission") ? 400 : 500;
      res.status(status).json({ error: error.message || "Failed to submit quiz." });
    }
  }
);

/* ── Anonymous Final Submission ────────────────────────────────── */

router.post(
  "/anonymous/final",
  finalSubmissionLimiter,
  async (req: Request, res: Response) => {
    try {
      const {
        quizId,
        totalQuestions,
        score,
        correctAnswers,
        timeSpentSeconds,
        responses,
      } = req.body;

      if (!quizId || !totalQuestions || score === undefined || correctAnswers === undefined) {
        res.status(400).json({ error: "quizId, totalQuestions, score, and correctAnswers are required." });
        return;
      }

      const { ipAddress, userAgent } = getClientInfo(req);

      const result = await submitAnonymousFinal({
        quizId: Number(quizId),
        totalQuestions: Number(totalQuestions),
        score: Number(score),
        correctAnswers: Number(correctAnswers),
        timeSpentSeconds: timeSpentSeconds ? Number(timeSpentSeconds) : undefined,
        responses,
        ipAddress,
        userAgent,
      });

      res.status(201).json({
        success: true,
        sessionToken: result.sessionToken,
        verified: true,
      });
    } catch (error: any) {
      console.error("[PROGRESS] Anonymous final submission error:", error);
      const status = error.message?.includes("Incomplete submission") ? 400 : 500;
      res.status(status).json({ error: error.message || "Failed to submit quiz." });
    }
  }
);

/* ── Verification ──────────────────────────────────────────────── */

router.get("/verify/:attemptId", authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const attemptId = parseInt(req.params.attemptId as string);
    const userId = req.user!.id;

    if (isNaN(attemptId)) {
      res.status(400).json({ error: "Invalid attemptId." });
      return;
    }

    const exists = await verifyAuthenticatedSubmission(attemptId, userId);
    res.json({ exists });
  } catch (error) {
    console.error("[PROGRESS] Verification error:", error);
    res.status(500).json({ error: "Verification failed." });
  }
});

router.get("/anonymous/verify/:token", async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;
    const exists = await verifyAnonymousSubmission(token);
    res.json({ exists });
  } catch (error) {
    console.error("[PROGRESS] Anonymous verification error:", error);
    res.status(500).json({ error: "Verification failed." });
  }
});

export default router;
