import { pgTable, serial, varchar, text, integer, timestamp, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  isActive: boolean("is_active").default(true).notNull(),
  mfaSecret: varchar("mfa_secret", { length: 255 }),
  mfaEnabled: boolean("mfa_enabled").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  quizAttempts: many(quizAttempts),
  refreshTokens: many(refreshTokens),
  auditLogs: many(auditLogs),
  anonymousAttempts: many(anonymousAttempts),
}));

export const refreshTokens = pgTable("refresh_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revokedAt: timestamp("revoked_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
}));

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: varchar("resource_id", { length: 100 }),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }),
  totalQuestions: integer("total_questions").notNull(),
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizzesRelations = relations(quizzes, ({ many }) => ({
  quizAttempts: many(quizAttempts),
}));

export const quizAttempts = pgTable("quiz_attempts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
  score: integer("score"),
  totalQuestions: integer("total_questions"),
  correctAnswers: integer("correct_answers"),
  timeSpentSeconds: integer("time_spent_seconds"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizAttemptsRelations = relations(quizAttempts, ({ one, many }) => ({
  user: one(users, { fields: [quizAttempts.userId], references: [users.id] }),
  quiz: one(quizzes, { fields: [quizAttempts.quizId], references: [quizzes.id] }),
  responses: many(quizResponses),
}));

export const quizResponses = pgTable("quiz_responses", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => quizAttempts.id),
  questionId: integer("question_id").notNull(),
  selectedAnswerIndex: integer("selected_answer_index").notNull(),
  isCorrect: boolean("is_correct").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const quizResponsesRelations = relations(quizResponses, ({ one }) => ({
  attempt: one(quizAttempts, { fields: [quizResponses.attemptId], references: [quizAttempts.id] }),
}));

export const anonymousAttempts = pgTable("anonymous_attempts", {
  id: serial("id").primaryKey(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  quizId: integer("quiz_id").notNull().references(() => quizzes.id),
  totalQuestions: integer("total_questions").notNull(),
  score: integer("score"),
  correctAnswers: integer("correct_answers"),
  timeSpentSeconds: integer("time_spent_seconds"),
  responsesJson: text("responses_json"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  linkedUserId: integer("linked_user_id").references(() => users.id, { onDelete: "set null" }),
  linkedAt: timestamp("linked_at"),
});

export const anonymousAttemptsRelations = relations(anonymousAttempts, ({ one }) => ({
  user: one(users, { fields: [anonymousAttempts.linkedUserId], references: [users.id] }),
  quiz: one(quizzes, { fields: [anonymousAttempts.quizId], references: [quizzes.id] }),
}));

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  format: varchar("format", { length: 20 }).notNull(), // csv, pdf
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, ready, failed
  params: text("params"), // JSON string of report params
  fileUrl: text("file_url"),
  expiresAt: timestamp("expires_at"),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportsRelations = relations(reports, ({ one, many }) => ({
  creator: one(users, { fields: [reports.createdBy], references: [users.id] }),
  accessLogs: many(reportAccessLogs),
}));

export const reportAccessLogs = pgTable("report_access_logs", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").notNull().references(() => reports.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 50 }).notNull(), // download, view
  ipAddress: varchar("ip_address", { length: 45 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reportAccessLogsRelations = relations(reportAccessLogs, ({ one }) => ({
  report: one(reports, { fields: [reportAccessLogs.reportId], references: [reports.id] }),
  user: one(users, { fields: [reportAccessLogs.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Quiz = typeof quizzes.$inferSelect;
export type NewQuiz = typeof quizzes.$inferInsert;
export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type NewQuizAttempt = typeof quizAttempts.$inferInsert;
export type QuizResponse = typeof quizResponses.$inferSelect;
export type NewQuizResponse = typeof quizResponses.$inferInsert;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
export type AnonymousAttempt = typeof anonymousAttempts.$inferSelect;
export type NewAnonymousAttempt = typeof anonymousAttempts.$inferInsert;
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type ReportAccessLog = typeof reportAccessLogs.$inferSelect;
export type NewReportAccessLog = typeof reportAccessLogs.$inferInsert;
