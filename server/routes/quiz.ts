import { Router } from "express";
import { db } from "../db/index";
import { quizzes, quizAttempts, quizResponses } from "../db/schema";
import { eq, desc, and, sql, count, avg, inArray } from "drizzle-orm";
import { authenticateToken, AuthRequest, logAudit } from "../middleware/auth";

const router = Router();

router.get("/quizzes", async (req, res) => {
  try {
    const allQuizzes = await db.select().from(quizzes).where(eq(quizzes.active, true));
    res.json({ quizzes: allQuizzes });
  } catch (error) {
    console.error("Get quizzes error:", error);
    res.status(500).json({ error: "Failed to fetch quizzes." });
  }
});

router.use(authenticateToken);

router.post("/attempts", async (req: AuthRequest, res) => {
  try {
    const { quizId, totalQuestions } = req.body;
    const userId = req.user!.id;

    const [attempt] = await db
      .insert(quizAttempts)
      .values({ userId, quizId, totalQuestions })
      .returning();

    await logAudit("QUIZ_ATTEMPT_CREATED", "quiz", {
      userId,
      resourceId: attempt.id.toString(),
      req,
      details: `Created attempt for quiz ${quizId}`,
    });

    res.status(201).json({ attempt });
  } catch (error) {
    console.error("Create attempt error:", error);
    res.status(500).json({ error: "Failed to create attempt." });
  }
});

router.patch("/attempts/:id/complete", async (req: AuthRequest, res) => {
  try {
    const attemptId = parseInt(req.params.id as string);
    const { score, correctAnswers, timeSpentSeconds } = req.body;
    const userId = req.user!.id;

    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.id, attemptId), eq(quizAttempts.userId, userId)))
      .limit(1);

    if (!attempt) {
      res.status(404).json({ error: "Attempt not found or access denied." });
      return;
    }

    const [updated] = await db
      .update(quizAttempts)
      .set({ completedAt: new Date(), score, correctAnswers, timeSpentSeconds })
      .where(eq(quizAttempts.id, attemptId))
      .returning();

    await logAudit("QUIZ_ATTEMPT_COMPLETED", "quiz", {
      userId,
      resourceId: attemptId.toString(),
      req,
      details: `Completed attempt with score ${score}/${attempt.totalQuestions}`,
    });

    res.json({ attempt: updated });
  } catch (error) {
    console.error("Complete attempt error:", error);
    res.status(500).json({ error: "Failed to complete attempt." });
  }
});

router.post("/responses", async (req: AuthRequest, res) => {
  try {
    const { attemptId, responses } = req.body;
    const userId = req.user!.id;

    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.id, attemptId), eq(quizAttempts.userId, userId)))
      .limit(1);

    if (!attempt) {
      res.status(404).json({ error: "Attempt not found or access denied." });
      return;
    }

    const inserted = await db
      .insert(quizResponses)
      .values(
        responses.map((r: { questionId: number; selectedAnswerIndex: number; isCorrect: boolean }) => ({
          attemptId,
          questionId: r.questionId,
          selectedAnswerIndex: r.selectedAnswerIndex,
          isCorrect: r.isCorrect,
        }))
      )
      .returning();

    await logAudit("QUIZ_RESPONSES_SAVED", "quiz", {
      userId,
      resourceId: attemptId.toString(),
      req,
      details: `Saved ${responses.length} responses`,
    });

    res.status(201).json({ responses: inserted });
  } catch (error) {
    console.error("Save responses error:", error);
    res.status(500).json({ error: "Failed to save responses." });
  }
});

router.get("/my-attempts", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.createdAt));

    await logAudit("QUIZ_ATTEMPTS_LISTED", "quiz", { userId, req, details: "Listed my attempts" });
    res.json({ attempts });
  } catch (error) {
    console.error("Get my attempts error:", error);
    res.status(500).json({ error: "Failed to fetch attempts." });
  }
});

router.get("/my-progress", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const [stats] = await db
      .select({
        totalAttempts: count(),
        completedAttempts: count(sql`case when ${quizAttempts.completedAt} is not null then 1 end`),
        averageScore: avg(quizAttempts.score),
        bestScore: sql<number>`max(${quizAttempts.score})`,
        totalQuestions: sql<number>`sum(${quizAttempts.totalQuestions})`,
        totalCorrect: sql<number>`sum(${quizAttempts.correctAnswers})`,
      })
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId));

    const recentAttempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.createdAt))
      .limit(10);

    await logAudit("QUIZ_PROGRESS_VIEWED", "quiz", { userId, req, details: "Viewed progress stats" });

    res.json({ stats, recentAttempts });
  } catch (error) {
    console.error("Get my progress error:", error);
    res.status(500).json({ error: "Failed to fetch progress." });
  }
});

router.get("/attempts/:id/responses", async (req: AuthRequest, res) => {
  try {
    const attemptId = parseInt(req.params.id as string);
    const userId = req.user!.id;

    const [attempt] = await db
      .select()
      .from(quizAttempts)
      .where(and(eq(quizAttempts.id, attemptId), eq(quizAttempts.userId, userId)))
      .limit(1);

    if (!attempt) {
      res.status(404).json({ error: "Attempt not found." });
      return;
    }

    const responses = await db
      .select()
      .from(quizResponses)
      .where(eq(quizResponses.attemptId, attemptId));

    await logAudit("QUIZ_RESPONSES_VIEWED", "quiz", {
      userId,
      resourceId: attemptId.toString(),
      req,
      details: "Viewed attempt responses",
    });

    res.json({ responses });
  } catch (error) {
    console.error("Get responses error:", error);
    res.status(500).json({ error: "Failed to fetch responses." });
  }
});

router.get("/export", async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;

    const userAttempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.createdAt));

    const attemptIds = userAttempts.map((a) => a.id);
    const allResponses = attemptIds.length
      ? await db.select().from(quizResponses).where(inArray(quizResponses.attemptId, attemptIds))
      : [];

    const exportData = {
      exportedAt: new Date().toISOString(),
      userId,
      userEmail: req.user!.email,
      attempts: userAttempts.map((attempt) => ({
        ...attempt,
        responses: allResponses.filter((r) => r.attemptId === attempt.id),
      })),
    };

    await logAudit("QUIZ_DATA_EXPORTED", "quiz", { userId, req, details: `Exported ${userAttempts.length} attempts` });

    res.setHeader("Content-Disposition", `attachment; filename="quiz-export-${userId}-${Date.now()}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.json(exportData);
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: "Failed to export data." });
  }
});

export default router;
