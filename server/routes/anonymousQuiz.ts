import { Router, Request, Response } from "express";
import crypto from "crypto";
import { db } from "../db/index";
import { anonymousAttempts, quizzes, quizAttempts, quizResponses } from "../db/schema";
import { eq, and, isNull, gt, sql } from "drizzle-orm";
import { authenticateToken, AuthRequest } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";

const router = Router();

const ANONYMOUS_TOKEN_EXPIRY_DAYS = 7;

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

// Anonymous attempt creation — rate limited
router.post(
  "/anonymous/start",
  rateLimit({ windowMs: 60_000, max: 10, keyGenerator: (req) => `anon_start:${req.ip}` }),
  async (req: Request, res: Response) => {
    try {
      const { quizId, totalQuestions } = req.body;

      if (!quizId || !totalQuestions) {
        res.status(400).json({ error: "quizId and totalQuestions are required." });
        return;
      }

      const [quiz] = await db.select().from(quizzes).where(eq(quizzes.id, quizId)).limit(1);
      if (!quiz) {
        res.status(404).json({ error: "Quiz not found." });
        return;
      }

      const sessionToken = generateSessionToken();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + ANONYMOUS_TOKEN_EXPIRY_DAYS);

      const [record] = await db
        .insert(anonymousAttempts)
        .values({
          sessionToken,
          quizId,
          totalQuestions,
          expiresAt,
          ipAddress: req.ip || null,
          userAgent: req.headers["user-agent"] || null,
        })
        .returning();

      res.status(201).json({ sessionToken, expiresAt: record.expiresAt });
    } catch (error) {
      console.error("Anonymous start error:", error);
      res.status(500).json({ error: "Failed to create anonymous attempt." });
    }
  }
);

// Complete anonymous attempt
router.patch(
  "/anonymous/:token/complete",
  rateLimit({ windowMs: 60_000, max: 10, keyGenerator: (req) => `anon_complete:${req.ip}` }),
  async (req: Request, res: Response) => {
    try {
      const token = req.params.token as string;
      const { score, correctAnswers, timeSpentSeconds, responses } = req.body;

      const [record] = await db
        .select()
        .from(anonymousAttempts)
        .where(
          and(
            eq(anonymousAttempts.sessionToken, token),
            isNull(anonymousAttempts.linkedUserId),
            gt(anonymousAttempts.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!record) {
        res.status(404).json({ error: "Attempt not found or expired." });
        return;
      }

      const [updated] = await db
        .update(anonymousAttempts)
        .set({
          score,
          correctAnswers,
          timeSpentSeconds,
          responsesJson: responses ? JSON.stringify(responses) : null,
        })
        .where(eq(anonymousAttempts.id, record.id))
        .returning();

      res.json({ attempt: updated });
    } catch (error) {
      console.error("Anonymous complete error:", error);
      res.status(500).json({ error: "Failed to complete anonymous attempt." });
    }
  }
);

// Preview anonymous results (limited) — no auth required
router.get("/anonymous/:token/preview", async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;

    const [record] = await db
      .select()
      .from(anonymousAttempts)
      .where(
        and(
          eq(anonymousAttempts.sessionToken, token),
          gt(anonymousAttempts.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!record) {
      res.status(404).json({ error: "Attempt not found or expired." });
      return;
    }

    // Return limited preview data only
    res.json({
      score: record.score,
      totalQuestions: record.totalQuestions,
      correctAnswers: record.correctAnswers,
      timeSpentSeconds: record.timeSpentSeconds,
      completedAt: record.createdAt,
      requiresAuth: true,
    });
  } catch (error) {
    console.error("Anonymous preview error:", error);
    res.status(500).json({ error: "Failed to fetch preview." });
  }
});

// Link anonymous attempt to authenticated user
router.post(
  "/anonymous/:token/link",
  authenticateToken,
  async (req: AuthRequest, res: Response) => {
    try {
      const token = req.params.token as string;
      const userId = req.user!.id;

      const [record] = await db
        .select()
        .from(anonymousAttempts)
        .where(
          and(
            eq(anonymousAttempts.sessionToken, token),
            isNull(anonymousAttempts.linkedUserId),
            gt(anonymousAttempts.expiresAt, new Date())
          )
        )
        .limit(1);

      if (!record) {
        res.status(404).json({ error: "Attempt not found, already linked, or expired." });
        return;
      }

      // Link the anonymous attempt
      await db
        .update(anonymousAttempts)
        .set({ linkedUserId: userId, linkedAt: new Date() })
        .where(eq(anonymousAttempts.id, record.id));

      // Create a proper quiz attempt for the user
      const [attempt] = await db
        .insert(quizAttempts)
        .values({
          userId,
          quizId: record.quizId,
          totalQuestions: record.totalQuestions,
          score: record.score,
          correctAnswers: record.correctAnswers,
          timeSpentSeconds: record.timeSpentSeconds,
          completedAt: new Date(),
        })
        .returning();

      // Migrate responses if present
      if (record.responsesJson) {
        const responses = JSON.parse(record.responsesJson);
        if (Array.isArray(responses) && responses.length > 0) {
          await db.insert(quizResponses).values(
            responses.map((r: any) => ({
              attemptId: attempt.id,
              questionId: r.questionId,
              selectedAnswerIndex: r.selectedAnswerIndex,
              isCorrect: r.isCorrect,
            }))
          );
        }
      }

      res.json({ attempt, linked: true });
    } catch (error) {
      console.error("Anonymous link error:", error);
      res.status(500).json({ error: "Failed to link anonymous attempt." });
    }
  }
);

// Cleanup job helper — can be called via admin endpoint or cron
export async function cleanupExpiredAnonymousAttempts() {
  const result = await db
    .delete(anonymousAttempts)
    .where(
      and(
        gt(sql`NOW()`, anonymousAttempts.expiresAt),
        isNull(anonymousAttempts.linkedUserId)
      )
    );
  return result;
}

export default router;
