/**
 * Production environment validation.
 * Throws clear errors at startup if any mandatory variable is missing.
 */

export const NODE_ENV = process.env.NODE_ENV || "development";
export const IS_PRODUCTION = NODE_ENV === "production";
export const IS_STAGING = NODE_ENV === "staging";

const REQUIRED_PROD = ["DATABASE_URL", "JWT_SECRET"];
const REQUIRED_ALL = ["DATABASE_URL"];

function validate() {
  const toCheck = IS_PRODUCTION ? REQUIRED_PROD : REQUIRED_ALL;
  const missing: string[] = [];

  for (const key of toCheck) {
    if (!process.env[key] || process.env[key]!.trim().length === 0) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    throw new Error(
      `[ENV ERROR] Missing required environment variables: ${missing.join(", ")}. ` +
      `Please set them before starting the server.`
    );
  }
}

validate();

export const PORT = parseInt(process.env.PORT || "4000", 10);
export const DATABASE_URL = process.env.DATABASE_URL!;
export const JWT_SECRET = process.env.JWT_SECRET!;

export const CORS_ORIGIN = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : IS_PRODUCTION
  ? []
  : true;

export const COOKIE_SECRET = process.env.COOKIE_SECRET || JWT_SECRET;

export const RATE_LIMIT_WINDOW_MS = parseInt(
  process.env.RATE_LIMIT_WINDOW_MS || "60000",
  10
);
export const RATE_LIMIT_MAX = parseInt(
  process.env.RATE_LIMIT_MAX || "100",
  10
);

export const DB_POOL_MAX = parseInt(process.env.DB_POOL_MAX || "10", 10);
