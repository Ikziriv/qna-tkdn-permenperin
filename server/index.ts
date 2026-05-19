import "dotenv/config";
import path from "path";
import fs from "fs";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import quizRoutes from "./routes/quiz";
import anonymousQuizRoutes from "./routes/anonymousQuiz";
import adminRoutes from "./routes/admin";
import activityRoutes from "./routes/activity";
import progressRoutes from "./routes/progress";
import {
  NODE_ENV,
  PORT,
  IS_PRODUCTION,
  IS_STAGING,
  IS_DEVELOPMENT,
  CORS_ORIGIN,
  RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX,
  getPublicConfig,
} from "./config/env";
import { rateLimit } from "./middleware/rateLimit";

const app = express();

// --- Security Headers (Helmet fallback) ---
let helmetMiddleware: any = null;
try {
  const helmet = require("helmet");
  helmetMiddleware = helmet({
    contentSecurityPolicy: IS_PRODUCTION ? undefined : false,
    crossOriginEmbedderPolicy: IS_PRODUCTION ? undefined : false,
  });
} catch {
  /* helmet not installed; fall back to manual headers below */
}

if (helmetMiddleware) {
  app.use(helmetMiddleware);
} else {
  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );
    if (IS_PRODUCTION) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=63072000; includeSubDomains; preload"
      );
    }
    next();
  });
}

// --- Response Compression ---
if (IS_PRODUCTION) {
  try {
    const compression = require("compression");
    app.use(compression());
  } catch {
    /* compression not available */
  }
}

// --- CORS (production-approved domains only) ---
const corsOptions: cors.CorsOptions =
  Array.isArray(CORS_ORIGIN) && CORS_ORIGIN.length > 0
    ? { origin: CORS_ORIGIN, credentials: true }
    : { origin: true, credentials: true };
app.use(cors(corsOptions));

// --- Body Parsing ---
app.use(express.json({ limit: "10kb" }));
app.use(cookieParser());

// --- Request Logging (production-safe) ---
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    // Redact sensitive paths from logs
    const path = req.path;
    const safePath =
      path.includes("/auth/") && !path.includes("/health")
        ? path.replace(/\/auth\/.*/, "/auth/[REDACTED]")
        : path;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${safePath} ${res.statusCode} ${duration}ms`
    );
  });
  next();
});

// --- Health Check (before rate limits) ---
app.get("/api/health", (_req, res) => {
  const uptimeSeconds = Math.floor(process.uptime());
  const config = getPublicConfig();

  const payload: Record<string, any> = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: uptimeSeconds,
    environment: config,
  };

  // Only expose detailed diagnostics in non-production environments
  if (IS_DEVELOPMENT || IS_STAGING) {
    payload.memory = process.memoryUsage();
    payload.nodeVersion = process.version;
    payload.platform = process.platform;
  }

  res.json(payload);
});

// --- Rate Limiting ---
const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX,
  message: "Too many requests. Please slow down.",
});
app.use("/api", globalRateLimiter);

// Stricter rate limits for auth endpoints
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  keyGenerator: (req: Request) =>
    `${req.ip}:${req.body?.email || "unknown"}`,
  message: "Too many authentication attempts. Please try again later.",
});
app.use("/api/auth/register", authRateLimiter);
app.use("/api/auth/login", authRateLimiter);

// --- API Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/quiz", anonymousQuizRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/progress", progressRoutes);

// --- Serve Frontend (when dist exists) ---
const distPath = path.resolve(process.cwd(), "dist");
const hasDist = fs.existsSync(path.join(distPath, "index.html"));

if (hasDist) {
  app.use(express.static(distPath));
  if (IS_PRODUCTION || IS_STAGING) {
    console.log(`[SERVER] Serving static files from ${distPath}`);
  }
} else if (IS_PRODUCTION || IS_STAGING) {
  console.warn(`[SERVER WARNING] dist/index.html not found at ${distPath}. Frontend will NOT be served. Run "npm run build" first.`);
}

// --- 404 Handler (SPA fallback) ---
app.use((req: Request, res: Response) => {
  if (hasDist && !req.path.startsWith("/api")) {
    res.sendFile(path.join(distPath, "index.html"));
    return;
  }
  res.status(404).json({ error: "Endpoint not found." });
});

// --- Global Error Handler ---
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[ERROR]", err);
  const message = IS_PRODUCTION
    ? "An unexpected error occurred."
    : err.message || "Internal server error";
  res.status(err.status || 500).json({ error: message });
});

// --- Graceful Startup ---
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`[${NODE_ENV}] Server running on port ${PORT}`);
  if (IS_PRODUCTION) {
    console.log("CORS allowed origins:", CORS_ORIGIN);
  }
});

// --- Graceful Shutdown ---
function shutdown(signal: string) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });
  setTimeout(() => {
    console.error("Forced shutdown after timeout.");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
