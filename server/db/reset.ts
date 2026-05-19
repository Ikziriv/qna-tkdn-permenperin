import "dotenv/config";
import { sql } from "drizzle-orm";
import { db } from "./index";

const TABLES = [
  "quiz_responses",
  "quiz_attempts",
  "anonymous_attempts",
  "refresh_tokens",
  "audit_logs",
  "quizzes",
  "users",
];

async function reset() {
  console.log("Resetting database...");

  // Check which tables actually exist (idempotent for fresh DBs)
  const tableInList = TABLES.map((t) => `'${t}'`).join(",");
  const existingRows = await db.execute(
    sql.raw(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN (${tableInList})
    `)
  );

  const rows = Array.isArray(existingRows) ? existingRows : (existingRows.rows as any[]);
  const existing = rows.map((r) => r.table_name as string);

  if (existing.length === 0) {
    console.log("No tables found to reset. Run 'npm run db:push' to create schema first.");
    process.exit(0);
    return;
  }

  const tableList = existing.map((t) => `"${t}"`).join(",");
  await db.execute(
    sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`)
  );

  console.log(`Truncated tables: ${existing.join(", ")}`);
  process.exit(0);
}

reset().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
