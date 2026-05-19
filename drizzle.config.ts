import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./drizzle",
  schema: "./server/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  tablesFilter: ["users", "quizzes", "quiz_attempts", "quiz_responses", "refresh_tokens", "audit_logs", "anonymous_attempts", "reports", "report_access_logs"],
});
