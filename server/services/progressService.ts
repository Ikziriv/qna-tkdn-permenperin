/**
 * Progress Service — Atomic Final Submission
 *
 * Ensures only fully completed quiz submissions are persisted.
 * All writes happen within a single database transaction.
 */

import { db } from "../db/index";
import { quizAttempts, quizResponses, anonymousAttempts } from "../db/schema";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import { validateCompleteness } from "./progressValidation";

const ANONYMOUS_TOKEN_EXPIRY_DAYS = 7;

interface FinalSubmissionInput {
  quizId: number;
  totalQuestions: number;
  score: number;
  correctAnswers: number;
  timeSpentSeconds?: number;
  responses: {
    questionId: number;
    selectedAnswerIndex: number;
    isCorrect: boolean;
  }[];
}

interface AuthenticatedSubmissionInput extends FinalSubmissionInput {
  userId: number;
}

interface AnonymousSubmissionInput extends FinalSubmissionInput {
  ipAddress?: string;
  userAgent?: string;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/* ── Authenticated Final Submission ──────────────────────────────── */

export async function submitAuthenticatedFinal(
  input: AuthenticatedSubmissionInput
): Promise<{ attemptId: number }> {
  const validation = validateCompleteness(input);
  if (validation.valid === false) {
    throw new Error(validation.reason);
  }

  return await db.transaction(async (trx) => {
    // 1. Create attempt
    const [attempt] = await trx
      .insert(quizAttempts)
      .values({
        userId: input.userId,
        quizId: input.quizId,
        totalQuestions: input.totalQuestions,
      })
      .returning();

    // 2. Insert all responses
    await trx.insert(quizResponses).values(
      input.responses.map((r) => ({
        attemptId: attempt.id,
        questionId: r.questionId,
        selectedAnswerIndex: r.selectedAnswerIndex,
        isCorrect: r.isCorrect,
      }))
    );

    // 3. Mark complete with score
    await trx
      .update(quizAttempts)
      .set({
        completedAt: new Date(),
        score: input.score,
        correctAnswers: input.correctAnswers,
        timeSpentSeconds: input.timeSpentSeconds || null,
      })
      .where(sql`${quizAttempts.id} = ${attempt.id}`);

    return { attemptId: attempt.id };
  });
}

/* ── Anonymous Final Submission ──────────────────────────────────── */

export async function submitAnonymousFinal(
  input: AnonymousSubmissionInput
): Promise<{ sessionToken: string }> {
  const validation = validateCompleteness(input);
  if (validation.valid === false) {
    throw new Error(validation.reason);
  }

  const sessionToken = generateSessionToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + ANONYMOUS_TOKEN_EXPIRY_DAYS);

  await db.insert(anonymousAttempts).values({
    sessionToken,
    quizId: input.quizId,
    totalQuestions: input.totalQuestions,
    score: input.score,
    correctAnswers: input.correctAnswers,
    timeSpentSeconds: input.timeSpentSeconds || null,
    responsesJson: JSON.stringify(input.responses),
    expiresAt,
    ipAddress: input.ipAddress || null,
    userAgent: input.userAgent || null,
  });

  return { sessionToken };
}

/* ── Verification ──────────────────────────────────────────────── */

export async function verifyAuthenticatedSubmission(
  attemptId: number,
  userId: number
): Promise<boolean> {
  const rows = await db
    .select({ id: quizAttempts.id })
    .from(quizAttempts)
    .where(sql`${quizAttempts.id} = ${attemptId} AND ${quizAttempts.userId} = ${userId} AND ${quizAttempts.completedAt} IS NOT NULL`)
    .limit(1);
  return rows.length > 0;
}

export async function verifyAnonymousSubmission(
  sessionToken: string
): Promise<boolean> {
  const rows = await db
    .select({ id: anonymousAttempts.id })
    .from(anonymousAttempts)
    .where(sql`${anonymousAttempts.sessionToken} = ${sessionToken}`)
    .limit(1);
  return rows.length > 0;
}
