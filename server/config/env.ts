/**
 * Environment Configuration with Zod Schema Validation
 *
 * This module centralizes all server-side environment variable access.
 * It uses Zod to validate types, formats, and required fields at startup,
 * throwing descriptive errors before the server attempts to boot.
 *
 * Benefits:
 * - Fail-fast: Server refuses to start if config is invalid
 * - Type-safe: All exported values are properly typed
 * - Documented: Schema serves as self-documenting config spec
 * - Secure: Secrets are never exposed; defaults only for safe local dev
 */

import { z } from "zod";

/* ------------------------------------------------------------------ */
/*  Schema Definition                                                  */
/* ------------------------------------------------------------------ */

const envSchema = z
  .object({
    /* Core */
    NODE_ENV: z
      .enum(["development", "production", "staging", "test"])
      .default("development"),
    PORT: z
      .string()
      .regex(/^\d+$/, "PORT must be a valid integer string")
      .default("4000")
      .transform((v) => parseInt(v, 10)),

    /* Database */
    DATABASE_URL: z
      .string()
      .min(1, "DATABASE_URL is required")
      .refine(
        (val) => val.startsWith("postgresql://") || val.startsWith("postgres://"),
        { message: "DATABASE_URL must be a valid PostgreSQL connection string" }
      ),

    /* Security */
    JWT_SECRET: z
      .string()
      .min(32, "JWT_SECRET must be at least 32 characters for security")
      .optional(),
    COOKIE_SECRET: z.string().min(1).optional(),

    /* CORS */
    CORS_ORIGIN: z
      .string()
      .optional()
      .transform((val) => {
        if (!val || val.trim().length === 0) return undefined;
        return val.split(",").map((o) => o.trim());
      }),

    /* Rate Limiting */
    RATE_LIMIT_WINDOW_MS: z
      .string()
      .regex(/^\d+$/)
      .default("60000")
      .transform((v) => parseInt(v, 10)),
    RATE_LIMIT_MAX: z
      .string()
      .regex(/^\d+$/)
      .default("100")
      .transform((v) => parseInt(v, 10)),

    /* Database Pool */
    DB_POOL_MAX: z
      .string()
      .regex(/^\d+$/)
      .default("10")
      .transform((v) => parseInt(v, 10)),
  })
  .superRefine((data, ctx) => {
    /* Production safety gate: block startup if critical secrets missing */
    if (data.NODE_ENV === "production") {
      if (!data.JWT_SECRET || data.JWT_SECRET.trim().length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_SECRET"],
          message: "JWT_SECRET is required in production. Generate a strong secret and set it as an environment variable.",
        });
      }
      if (!data.CORS_ORIGIN || data.CORS_ORIGIN.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["CORS_ORIGIN"],
          message:
            "CORS_ORIGIN is required in production. Set it to your frontend domain(s) to prevent unauthorized cross-origin requests.",
        });
      }
    }
  });

/* ------------------------------------------------------------------ */
/*  Parse & Validate                                                   */
/* ------------------------------------------------------------------ */

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const lines = parsed.error.issues.map(
    (issue) => `  - ${issue.path.join(".")}: ${issue.message}`
  );
  console.error(
    "\n[ENV CONFIG ERROR] The server cannot start due to invalid or missing environment variables:\n" +
      lines.join("\n") +
      "\n\nPlease review your .env file and ensure all required variables are set correctly.\n"
  );
  process.exit(1);
}

const env = parsed.data;

/* ------------------------------------------------------------------ */
/*  Derived Flags                                                      */
/* ------------------------------------------------------------------ */

export const NODE_ENV = env.NODE_ENV;
export const IS_PRODUCTION = NODE_ENV === "production";
export const IS_STAGING = NODE_ENV === "staging";
export const IS_DEVELOPMENT = NODE_ENV === "development";

/* ------------------------------------------------------------------ */
/*  Exported Config Values                                             */
/* ------------------------------------------------------------------ */

export const PORT = env.PORT;
export const DATABASE_URL = env.DATABASE_URL;
export const JWT_SECRET = env.JWT_SECRET || "dev-jwt-secret-change-me";
export const COOKIE_SECRET = env.COOKIE_SECRET || JWT_SECRET;

export const CORS_ORIGIN: string[] | boolean =
  Array.isArray(env.CORS_ORIGIN) && env.CORS_ORIGIN.length > 0
    ? env.CORS_ORIGIN
    : IS_PRODUCTION
      ? []
      : true;

export const RATE_LIMIT_WINDOW_MS = env.RATE_LIMIT_WINDOW_MS;
export const RATE_LIMIT_MAX = env.RATE_LIMIT_MAX;
export const DB_POOL_MAX = env.DB_POOL_MAX;

/* ------------------------------------------------------------------ */
/*  Health / Debug Payload (no secrets exposed)                        */
/* ------------------------------------------------------------------ */

export function getPublicConfig() {
  return {
    nodeEnv: NODE_ENV,
    isProduction: IS_PRODUCTION,
    isStaging: IS_STAGING,
    isDevelopment: IS_DEVELOPMENT,
    port: PORT,
    rateLimitWindowMs: RATE_LIMIT_WINDOW_MS,
    rateLimitMax: RATE_LIMIT_MAX,
    dbPoolMax: DB_POOL_MAX,
    corsOriginConfigured:
      Array.isArray(CORS_ORIGIN) && CORS_ORIGIN.length > 0,
    jwtSecretConfigured: JWT_SECRET !== "dev-jwt-secret-change-me",
    cookieSecretConfigured: env.COOKIE_SECRET !== undefined,
    databaseUrlConfigured: DATABASE_URL.length > 0,
  };
}
