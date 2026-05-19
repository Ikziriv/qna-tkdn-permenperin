import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "../db/index";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  authenticateToken,
  AuthRequest,
  logAudit,
} from "../middleware/auth";

const router = Router();

router.post("/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      res.status(400).json({ error: "Email, password, and name are required." });
      return;
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "User already exists." });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db
      .insert(users)
      .values({ email, passwordHash, name, role: "user" })
      .returning({ id: users.id, email: users.email, name: users.name, role: users.role });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = await generateRefreshToken(newUser.id);

    await logAudit("REGISTER", "auth", { userId: newUser.id, req, details: "User registered" });

    res.status(201).json({ user: newUser, token: accessToken, refreshToken });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password, mfaCode } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required." });
      return;
    }

    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await logAudit("LOGIN_FAILED", "auth", { userId: user.id, req, details: "Invalid password" });
      res.status(401).json({ error: "Invalid credentials." });
      return;
    }

    const publicUser = { id: user.id, email: user.email, name: user.name, role: user.role };

    if (user.mfaEnabled && user.mfaSecret) {
      if (!mfaCode) {
        res.status(403).json({ error: "MFA required.", mfaRequired: true });
        return;
      }

      const isValidMfa = verifyMfaCode(user.mfaSecret, mfaCode);
      if (!isValidMfa) {
        await logAudit("MFA_FAILED", "auth", { userId: user.id, req, details: "Invalid MFA code" });
        res.status(401).json({ error: "Invalid MFA code." });
        return;
      }

      const accessToken = generateAccessToken(publicUser, true);
      const refreshToken = await generateRefreshToken(user.id);
      await logAudit("LOGIN", "auth", { userId: user.id, req, details: "User logged in with MFA" });
      res.json({ user: publicUser, token: accessToken, refreshToken });
      return;
    }

    const accessToken = generateAccessToken(publicUser);
    const refreshToken = await generateRefreshToken(user.id);

    await logAudit("LOGIN", "auth", { userId: user.id, req, details: "User logged in" });
    res.json({ user: publicUser, token: accessToken, refreshToken });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed." });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      res.status(401).json({ error: "Refresh token required." });
      return;
    }

    const record = await verifyRefreshToken(refreshToken);
    if (!record) {
      res.status(401).json({ error: "Invalid or expired refresh token." });
      return;
    }

    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role })
      .from(users)
      .where(eq(users.id, record.userId))
      .limit(1);

    if (!user) {
      res.status(401).json({ error: "User not found." });
      return;
    }

    await revokeRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = await generateRefreshToken(user.id);

    await logAudit("TOKEN_REFRESH", "auth", { userId: user.id, req, details: "Access token refreshed" });

    res.json({ token: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    console.error("Refresh error:", error);
    res.status(500).json({ error: "Token refresh failed." });
  }
});

router.post("/logout", async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }
    res.json({ message: "Logged out successfully." });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed." });
  }
});

router.post("/logout-all", authenticateToken, async (req: AuthRequest, res) => {
  try {
    await revokeAllUserRefreshTokens(req.user!.id);
    await logAudit("LOGOUT_ALL", "auth", { userId: req.user!.id, req, details: "Logged out all sessions" });
    res.json({ message: "All sessions logged out." });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({ error: "Failed to log out all sessions." });
  }
});

router.get("/me", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        mfaEnabled: users.mfaEnabled,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, req.user!.id))
      .limit(1);

    if (!user) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ error: "Failed to fetch user." });
  }
});

router.post("/mfa/setup", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const secret = generateMfaSecret();
    const otpauthUrl = `otpauth://totp/TKDN:${req.user!.email}?secret=${secret}&issuer=TKDN%20Compliance`;

    await db
      .update(users)
      .set({ mfaSecret: secret })
      .where(eq(users.id, req.user!.id));

    res.json({ secret, otpauthUrl });
  } catch (error) {
    console.error("MFA setup error:", error);
    res.status(500).json({ error: "MFA setup failed." });
  }
});

router.post("/mfa/verify", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    const [user] = await db
      .select({ mfaSecret: users.mfaSecret })
      .from(users)
      .where(eq(users.id, req.user!.id))
      .limit(1);

    if (!user?.mfaSecret) {
      res.status(400).json({ error: "MFA not set up." });
      return;
    }

    if (!verifyMfaCode(user.mfaSecret, code)) {
      res.status(401).json({ error: "Invalid MFA code." });
      return;
    }

    await db.update(users).set({ mfaEnabled: true }).where(eq(users.id, req.user!.id));
    await logAudit("MFA_ENABLE", "auth", { userId: req.user!.id, req, details: "MFA enabled" });

    res.json({ message: "MFA enabled successfully." });
  } catch (error) {
    console.error("MFA verify error:", error);
    res.status(500).json({ error: "MFA verification failed." });
  }
});

router.post("/mfa/disable", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { code } = req.body;
    const [user] = await db
      .select({ mfaSecret: users.mfaSecret, mfaEnabled: users.mfaEnabled })
      .from(users)
      .where(eq(users.id, req.user!.id))
      .limit(1);

    if (!user?.mfaEnabled || !user?.mfaSecret) {
      res.status(400).json({ error: "MFA is not enabled." });
      return;
    }

    if (!verifyMfaCode(user.mfaSecret, code)) {
      res.status(401).json({ error: "Invalid MFA code." });
      return;
    }

    await db
      .update(users)
      .set({ mfaEnabled: false, mfaSecret: null })
      .where(eq(users.id, req.user!.id));
    await logAudit("MFA_DISABLE", "auth", { userId: req.user!.id, req, details: "MFA disabled" });

    res.json({ message: "MFA disabled successfully." });
  } catch (error) {
    console.error("MFA disable error:", error);
    res.status(500).json({ error: "MFA disable failed." });
  }
});

function generateMfaSecret(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let secret = "";
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
}

function verifyMfaCode(secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;

  const timeStep = 30;
  const now = Math.floor(Date.now() / 1000);
  const timeSlot = Math.floor(now / timeStep);

  for (let i = -1; i <= 1; i++) {
    const expected = generateTotp(secret, timeSlot + i);
    if (expected === code) return true;
  }
  return false;
}

function generateTotp(secret: string, timeSlot: number): string {
  const key = base32Decode(secret);
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(timeSlot), 0);

  const hmac = crypto.createHmac("sha1", key).update(msg).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24 |
      (hmac[offset + 1] & 0xff) << 16 |
      (hmac[offset + 2] & 0xff) << 8 |
      (hmac[offset + 3] & 0xff)) % 1000000;
  return code.toString().padStart(6, "0");
}

function base32Decode(str: string): Buffer {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = "";
  for (const c of str.toUpperCase()) {
    const idx = chars.indexOf(c);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, "0");
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

export default router;
