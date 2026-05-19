import { config } from "dotenv";
config();

import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { DATABASE_URL, DB_POOL_MAX, IS_PRODUCTION } from "../config/env";

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: DB_POOL_MAX,
  ssl: IS_PRODUCTION ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Graceful pool cleanup on process exit
process.on("SIGTERM", () => pool.end());
process.on("SIGINT", () => pool.end());

export const db = drizzle(pool, { schema });
