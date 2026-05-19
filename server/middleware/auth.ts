import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { db } from "../db/index";
import { refreshTokens, auditLogs } from "../db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";

import { JWT_SECRET } from "../config/env";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY_DAYS = 7;

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    name: string;
    role: string;
    mfaVerified?: boolean;
  };
}

export function generateAccessToken(user: { id: number; email: string; name: string; role: string }, mfaVerified = false) {
  return jwt.sign({ ...user, mfaVerified }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export async function generateRefreshToken(userId: number) {
  const rawToken = crypto.randomBytes(64).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);

  await db.insert(refreshTokens).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return rawToken;
}

export async function verifyRefreshToken(rawToken: string) {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");

  const [record] = await db
    .select()
    .from(refreshTokens)
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
        gt(refreshTokens.expiresAt, new Date())
      )
    )
    .limit(1);

  return record || null;
}

export async function revokeRefreshToken(rawToken: string) {
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(eq(refreshTokens.tokenHash, tokenHash));
}

export async function revokeAllUserRefreshTokens(userId: number) {
  await db
    .update(refreshTokens)
    .set({ revokedAt: new Date() })
    .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest["user"];
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token." });
    return;
  }
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  next();
}

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions." });
      return;
    }
    next();
  };
}

export function requireMfa(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required." });
    return;
  }
  if (req.user.mfaVerified !== true) {
    res.status(403).json({ error: "MFA verification required." });
    return;
  }
  next();
}

export async function logAudit(
  action: string,
  resource: string,
  options: {
    userId?: number;
    resourceId?: string;
    req?: Request;
    details?: string;
  } = {}
) {
  try {
    await db.insert(auditLogs).values({
      userId: options.userId || null,
      action,
      resource,
      resourceId: options.resourceId || null,
      ipAddress: options.req?.ip || (options.req?.headers["x-forwarded-for"] as string) || null,
      userAgent: options.req?.headers["user-agent"] || null,
      details: options.details || null,
    });
  } catch (err) {
    console.error("Audit log failed:", err);
  }
}

export function audit(action: string, resource: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.on("finish", async () => {
      if (req.user) {
        await logAudit(action, resource, {
          userId: req.user.id,
          req,
          details: `Method: ${req.method}, Status: ${res.statusCode}, Path: ${req.originalUrl}`,
        });
      }
    });
    next();
  };
}
