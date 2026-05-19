/**
 * Activity Tracker Service
 *
 * Centralized service for recording user interactions across the application.
 * Handles both authenticated and anonymous sessions, with automatic IP
 * anonymization support and GDPR-safe data collection.
 */

import { db } from "../db/index";
import {
  activityEvents,
  onboardingSessions,
  quizAnswerLogs,
  dataRetentionPolicies,
} from "../db/schema";
import { eq, sql, lte } from "drizzle-orm";

/* ── Types ─────────────────────────────────────────────────────────── */

export type EventType =
  | "onboarding_start"
  | "onboarding_complete"
  | "onboarding_abandon"
  | "quiz_start"
  | "quiz_answer"
  | "quiz_complete"
  | "quiz_abandon"
  | "page_view"
  | "login"
  | "logout"
  | "register";

export interface TrackEventInput {
  eventType: EventType;
  userId?: number | null;
  sessionId?: string;
  payload?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface OnboardingSessionInput {
  sessionToken: string;
  userId?: number | null;
  name?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface QuizAnswerLogInput {
  attemptId?: number | null;
  sessionToken?: string;
  questionId: number;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  timeSpentSeconds?: number;
  ipAddress?: string;
  userAgent?: string;
}

/* ── Helpers ───────────────────────────────────────────────────────── */

function anonymizeIp(ip?: string): string | undefined {
  if (!ip) return undefined;
  // Remove last octet for IPv4 or last 80 bits for IPv6
  if (ip.includes(".")) {
    return ip.replace(/\.\d+$/, ".0");
  }
  if (ip.includes(":")) {
    return ip.replace(/:[^:]*$/, ":0");
  }
  return ip;
}

function safePayload(payload?: Record<string, unknown>): string | undefined {
  if (!payload) return undefined;
  // Strip any potentially sensitive fields before storage
  const cleaned = { ...payload };
  const sensitiveKeys = ["password", "token", "secret", "creditCard", "ssn", "pin"];
  for (const key of sensitiveKeys) {
    delete cleaned[key];
    // Also handle nested keys with simple string match
    for (const k of Object.keys(cleaned)) {
      if (k.toLowerCase().includes(key.toLowerCase())) {
        delete cleaned[k];
      }
    }
  }
  return JSON.stringify(cleaned);
}

/* ── Public API ────────────────────────────────────────────────────── */

export async function trackEvent(input: TrackEventInput): Promise<number> {
  const [result] = await db
    .insert(activityEvents)
    .values({
      eventType: input.eventType,
      userId: input.userId || null,
      sessionId: input.sessionId || null,
      payload: safePayload(input.payload),
      ipAddress: anonymizeIp(input.ipAddress),
      userAgent: input.userAgent || null,
    })
    .returning({ id: activityEvents.id });
  return result.id;
}

export async function trackEventsBatch(
  inputs: TrackEventInput[],
  _validEventTypes?: string[]
): Promise<number[]> {
  if (inputs.length === 0) return [];

  const values = inputs.map((input) => ({
    eventType: input.eventType,
    userId: input.userId || null,
    sessionId: input.sessionId || null,
    payload: safePayload(input.payload),
    ipAddress: anonymizeIp(input.ipAddress),
    userAgent: input.userAgent || null,
  }));

  const results = await db.insert(activityEvents).values(values).returning({ id: activityEvents.id });
  return results.map((r) => r.id);
}

export async function startOnboardingSession(
  input: OnboardingSessionInput
): Promise<number> {
  const [result] = await db
    .insert(onboardingSessions)
    .values({
      sessionToken: input.sessionToken,
      userId: input.userId || null,
      name: input.name || null,
      role: input.role || null,
      completionStatus: "started",
      ipAddress: anonymizeIp(input.ipAddress),
      userAgent: input.userAgent || null,
    })
    .returning({ id: onboardingSessions.id });
  return result.id;
}

export async function completeOnboardingSession(
  sessionToken: string,
  extra?: { name?: string; role?: string; stepProgress?: Record<string, unknown> }
): Promise<void> {
  await db
    .update(onboardingSessions)
    .set({
      completionStatus: "completed",
      completedAt: new Date(),
      ...(extra?.name && { name: extra.name }),
      ...(extra?.role && { role: extra.role }),
      ...(extra?.stepProgress && {
        stepProgress: JSON.stringify(extra.stepProgress),
      }),
    })
    .where(eq(onboardingSessions.sessionToken, sessionToken));
}

export async function abandonOnboardingSession(
  sessionToken: string,
  stepProgress?: Record<string, unknown>
): Promise<void> {
  await db
    .update(onboardingSessions)
    .set({
      completionStatus: "abandoned",
      abandonedAt: new Date(),
      ...(stepProgress && { stepProgress: JSON.stringify(stepProgress) }),
    })
    .where(eq(onboardingSessions.sessionToken, sessionToken));
}

export async function logQuizAnswer(input: QuizAnswerLogInput): Promise<number> {
  const [result] = await db
    .insert(quizAnswerLogs)
    .values({
      attemptId: input.attemptId || null,
      sessionToken: input.sessionToken || null,
      questionId: input.questionId,
      selectedAnswerIndex: input.selectedAnswerIndex,
      isCorrect: input.isCorrect,
      timeSpentSeconds: input.timeSpentSeconds || null,
      ipAddress: anonymizeIp(input.ipAddress),
      userAgent: input.userAgent || null,
    })
    .returning({ id: quizAnswerLogs.id });
  return result.id;
}

/* ── Admin Queries ──────────────────────────────────────────────────── */

export async function getActivityEvents(options: {
  eventType?: string;
  userId?: number;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}) {
  const { eventType, userId, from, to, limit = 100, offset = 0 } = options;
  const conditions = [];

  if (eventType) conditions.push(eq(activityEvents.eventType, eventType));
  if (userId) conditions.push(eq(activityEvents.userId, userId));
  if (from) conditions.push(sql`${activityEvents.createdAt} >= ${from}`);
  if (to) conditions.push(sql`${activityEvents.createdAt} <= ${to}`);

  const query = db.select().from(activityEvents);
  const countQuery = db
    .select({ total: sql<number>`count(*)` })
    .from(activityEvents);

  const whereClause = conditions.length > 0 ? sql`${conditions.join(" AND ")}` : undefined;

  const items = await query
    .where(whereClause)
    .orderBy(sql`${activityEvents.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  const [countResult] = await countQuery.where(whereClause);

  return { items, total: Number(countResult.total) };
}

export async function getOnboardingSessions(options: {
  status?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}) {
  const { status, from, to, limit = 100, offset = 0 } = options;
  const conditions = [];

  if (status) conditions.push(eq(onboardingSessions.completionStatus, status));
  if (from) conditions.push(sql`${onboardingSessions.startedAt} >= ${from}`);
  if (to) conditions.push(sql`${onboardingSessions.startedAt} <= ${to}`);

  const query = db.select().from(onboardingSessions);
  const countQuery = db
    .select({ total: sql<number>`count(*)` })
    .from(onboardingSessions);

  const whereClause = conditions.length > 0 ? sql`${conditions.join(" AND ")}` : undefined;

  const items = await query
    .where(whereClause)
    .orderBy(sql`${onboardingSessions.startedAt} DESC`)
    .limit(limit)
    .offset(offset);

  const [countResult] = await countQuery.where(whereClause);

  return { items, total: Number(countResult.total) };
}

export async function getQuizAnswerLogs(options: {
  attemptId?: number;
  sessionToken?: string;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}) {
  const { attemptId, sessionToken, from, to, limit = 100, offset = 0 } = options;
  const conditions = [];

  if (attemptId) conditions.push(eq(quizAnswerLogs.attemptId, attemptId));
  if (sessionToken) conditions.push(eq(quizAnswerLogs.sessionToken, sessionToken));
  if (from) conditions.push(sql`${quizAnswerLogs.answeredAt} >= ${from}`);
  if (to) conditions.push(sql`${quizAnswerLogs.answeredAt} <= ${to}`);

  const query = db.select().from(quizAnswerLogs);
  const countQuery = db
    .select({ total: sql<number>`count(*)` })
    .from(quizAnswerLogs);

  const whereClause = conditions.length > 0 ? sql`${conditions.join(" AND ")}` : undefined;

  const items = await query
    .where(whereClause)
    .orderBy(sql`${quizAnswerLogs.answeredAt} DESC`)
    .limit(limit)
    .offset(offset);

  const [countResult] = await countQuery.where(whereClause);

  return { items, total: Number(countResult.total) };
}

/* ── Data Retention & Purge ────────────────────────────────────────── */

export async function purgeExpiredData(): Promise<{
  activityEvents: number;
  onboardingSessions: number;
  quizAnswerLogs: number;
}> {
  const policies = await db.select().from(dataRetentionPolicies).where(eq(dataRetentionPolicies.enabled, true));

  let deletedActivityEvents = 0;
  let deletedOnboardingSessions = 0;
  let deletedQuizAnswerLogs = 0;

  for (const policy of policies) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - policy.retentionDays);

    switch (policy.tableName) {
      case "activity_events": {
        const result = await db
          .delete(activityEvents)
          .where(lte(activityEvents.createdAt, cutoff))
          .returning({ id: activityEvents.id });
        deletedActivityEvents = result.length;
        break;
      }
      case "onboarding_sessions": {
        const result = await db
          .delete(onboardingSessions)
          .where(lte(onboardingSessions.startedAt, cutoff))
          .returning({ id: onboardingSessions.id });
        deletedOnboardingSessions = result.length;
        break;
      }
      case "quiz_answer_logs": {
        const result = await db
          .delete(quizAnswerLogs)
          .where(lte(quizAnswerLogs.answeredAt, cutoff))
          .returning({ id: quizAnswerLogs.id });
        deletedQuizAnswerLogs = result.length;
        break;
      }
    }

    await db
      .update(dataRetentionPolicies)
      .set({ lastPurgeAt: new Date() })
      .where(eq(dataRetentionPolicies.id, policy.id));
  }

  return {
    activityEvents: deletedActivityEvents,
    onboardingSessions: deletedOnboardingSessions,
    quizAnswerLogs: deletedQuizAnswerLogs,
  };
}

export async function clearAllMonitoringData(): Promise<{
  activityEvents: number;
  onboardingSessions: number;
  quizAnswerLogs: number;
}> {
  const [aeCount] = await db.select({ total: sql<number>`count(*)` }).from(activityEvents);
  const [osCount] = await db.select({ total: sql<number>`count(*)` }).from(onboardingSessions);
  const [qalCount] = await db.select({ total: sql<number>`count(*)` }).from(quizAnswerLogs);

  await db.delete(activityEvents);
  await db.delete(onboardingSessions);
  await db.delete(quizAnswerLogs);

  return {
    activityEvents: Number(aeCount.total),
    onboardingSessions: Number(osCount.total),
    quizAnswerLogs: Number(qalCount.total),
  };
}

/* ── Seed Default Retention Policies ───────────────────────────────── */

export async function seedRetentionPolicies(): Promise<void> {
  const defaults = [
    { tableName: "activity_events", retentionDays: 90 },
    { tableName: "onboarding_sessions", retentionDays: 365 },
    { tableName: "quiz_answer_logs", retentionDays: 365 },
  ];

  for (const def of defaults) {
    const existing = await db
      .select()
      .from(dataRetentionPolicies)
      .where(eq(dataRetentionPolicies.tableName, def.tableName));

    if (existing.length === 0) {
      await db.insert(dataRetentionPolicies).values(def);
    }
  }
}
