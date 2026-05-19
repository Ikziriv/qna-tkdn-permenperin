import { Router, Request, Response } from "express";
import { db } from "../db/index";
import { users, quizzes, quizAttempts, quizResponses, reports, reportAccessLogs } from "../db/schema";
import { eq, desc, sql, count, avg, sum, and, gte, lte } from "drizzle-orm";
import { authenticateToken, AuthRequest, requireRole } from "../middleware/auth";

const router = Router();

// ── RBAC helpers ──────────────────────────────────────────────────────────

function requireSuperAdmin(req: AuthRequest, res: Response): boolean {
  if (req.user!.role !== "super_admin") {
    res.status(403).json({ error: "Only super admins can perform this action." });
    return false;
  }
  return true;
}

function canManageUser(req: AuthRequest, targetRole: string): boolean {
  const caller = req.user!.role;
  if (caller === "super_admin") return true;
  if (caller === "admin" && targetRole === "user") return true;
  return false;
}

// ── Middleware ────────────────────────────────────────────────────────────

router.use(authenticateToken);
router.use(requireRole("super_admin", "admin"));

// ── Stats ─────────────────────────────────────────────────────────────────

router.get("/stats", async (req: AuthRequest, res) => {
  try {
    const [userStats] = await db.select({ totalUsers: count() }).from(users);
    const [activeUsers] = await db.select({ count: count() }).from(users).where(eq(users.isActive, true));
    const [quizStats] = await db.select({ totalQuizzes: count() }).from(quizzes);
    const [attemptStats] = await db
      .select({ totalAttempts: count(), avgScore: avg(quizAttempts.score), avgTimeSpent: avg(quizAttempts.timeSpentSeconds) })
      .from(quizAttempts);
    const [completedAttempts] = await db.select({ count: count() }).from(quizAttempts).where(sql`${quizAttempts.completedAt} is not null`);

    res.json({
      totalUsers: userStats.totalUsers,
      activeUsers: activeUsers.count,
      totalQuizzes: quizStats.totalQuizzes,
      totalAttempts: attemptStats.totalAttempts,
      completedAttempts: completedAttempts.count,
      averageScore: attemptStats.avgScore ? Number(attemptStats.avgScore).toFixed(2) : null,
      averageTimeSpentSeconds: attemptStats.avgTimeSpent ? Number(attemptStats.avgTimeSpent).toFixed(0) : null,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

// ── Attempts ─────────────────────────────────────────────────────────────

router.get("/attempts", async (req: AuthRequest, res) => {
  try {
    const allAttempts = await db
      .select({
        id: quizAttempts.id,
        userId: quizAttempts.userId,
        userName: users.name,
        userEmail: users.email,
        quizId: quizAttempts.quizId,
        startedAt: quizAttempts.startedAt,
        completedAt: quizAttempts.completedAt,
        score: quizAttempts.score,
        totalQuestions: quizAttempts.totalQuestions,
        correctAnswers: quizAttempts.correctAnswers,
        timeSpentSeconds: quizAttempts.timeSpentSeconds,
      })
      .from(quizAttempts)
      .leftJoin(users, eq(quizAttempts.userId, users.id))
      .orderBy(desc(quizAttempts.createdAt));
    res.json({ attempts: allAttempts });
  } catch (error) {
    console.error("Admin attempts error:", error);
    res.status(500).json({ error: "Failed to fetch attempts." });
  }
});

// ── Users ─────────────────────────────────────────────────────────────────

router.get("/users", async (req: AuthRequest, res) => {
  try {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));
    res.json({ users: allUsers });
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ error: "Failed to fetch users." });
  }
});

router.get("/users/:id", async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id as string);
    const [user] = await db
      .select({ id: users.id, email: users.email, name: users.name, role: users.role, isActive: users.isActive, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId));
    if (!user) { res.status(404).json({ error: "User not found." }); return; }

    const attempts = await db
      .select()
      .from(quizAttempts)
      .where(eq(quizAttempts.userId, userId))
      .orderBy(desc(quizAttempts.createdAt));

    res.json({ user, attempts });
  } catch (error) {
    console.error("Admin user detail error:", error);
    res.status(500).json({ error: "Failed to fetch user details." });
  }
});

router.patch("/users/:id/role", async (req: AuthRequest, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const userId = parseInt(req.params.id as string);
    const { role } = req.body;
    if (!["super_admin", "admin", "user"].includes(role)) { res.status(400).json({ error: "Invalid role." }); return; }
    if (userId === req.user!.id) { res.status(400).json({ error: "Cannot change your own role." }); return; }

    const [updated] = await db.update(users).set({ role }).where(eq(users.id, userId)).returning({ id: users.id, email: users.email, name: users.name, role: users.role });
    if (!updated) { res.status(404).json({ error: "User not found." }); return; }
    res.json({ user: updated });
  } catch (error) {
    console.error("Update role error:", error);
    res.status(500).json({ error: "Failed to update role." });
  }
});

router.patch("/users/:id/status", async (req: AuthRequest, res) => {
  try {
    const userId = parseInt(req.params.id as string);
    const { isActive } = req.body;
    if (typeof isActive !== "boolean") { res.status(400).json({ error: "isActive must be a boolean." }); return; }
    if (userId === req.user!.id) { res.status(400).json({ error: "Cannot change your own status." }); return; }

    const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
    if (!target) { res.status(404).json({ error: "User not found." }); return; }
    if (!canManageUser(req, target.role)) { res.status(403).json({ error: "You cannot manage this user's account." }); return; }

    const [updated] = await db.update(users).set({ isActive }).where(eq(users.id, userId)).returning({ id: users.id, email: users.email, name: users.name, role: users.role, isActive: users.isActive });
    res.json({ user: updated });
  } catch (error) {
    console.error("Update status error:", error);
    res.status(500).json({ error: "Failed to update user status." });
  }
});

router.delete("/users/:id", async (req: AuthRequest, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const userId = parseInt(req.params.id as string);
    if (userId === req.user!.id) { res.status(400).json({ error: "Cannot delete your own account." }); return; }

    const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId));
    if (!target) { res.status(404).json({ error: "User not found." }); return; }
    if (target.role === "super_admin") { res.status(403).json({ error: "Cannot delete a super admin account." }); return; }

    await db.delete(users).where(eq(users.id, userId));
    res.json({ success: true, message: "User deleted." });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({ error: "Failed to delete user." });
  }
});

// ── Leaderboard ───────────────────────────────────────────────────────────

router.get("/leaderboard", async (req: AuthRequest, res) => {
  try {
    const leaderboard = await db
      .select({
        userId: quizAttempts.userId,
        userName: users.name,
        totalAttempts: count(),
        averageScore: avg(quizAttempts.score),
        bestScore: sql<number>`max(${quizAttempts.score})`,
        totalTimeSpent: sum(quizAttempts.timeSpentSeconds),
      })
      .from(quizAttempts)
      .leftJoin(users, eq(quizAttempts.userId, users.id))
      .where(sql`${quizAttempts.completedAt} is not null`)
      .groupBy(quizAttempts.userId, users.name)
      .orderBy(desc(sql`max(${quizAttempts.score})`));
    res.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard error:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard." });
  }
});

// ── Daily Activity ────────────────────────────────────────────────────────

router.get("/daily-activity", async (req: AuthRequest, res) => {
  try {
    const activity = await db
      .select({
        date: sql<string>`date_trunc('day', ${quizAttempts.startedAt})::date`,
        attempts: count(),
        avgScore: avg(quizAttempts.score),
      })
      .from(quizAttempts)
      .groupBy(sql`date_trunc('day', ${quizAttempts.startedAt})::date`)
      .orderBy(sql`date_trunc('day', ${quizAttempts.startedAt})::date`);
    res.json({ activity });
  } catch (error) {
    console.error("Daily activity error:", error);
    res.status(500).json({ error: "Failed to fetch daily activity." });
  }
});

// ── Reports ─────────────────────────────────────────────────────────────────

function generateCSV(rows: any[], columns: string[]): string {
  const header = columns.join(",");
  const lines = rows.map((r) => columns.map((c) => `"${String(r[c] ?? "").replace(/"/g, '""')}"`).join(","));
  return [header, ...lines].join("\n");
}

router.post("/reports/generate", async (req: AuthRequest, res) => {
  try {
    const { name, format, params } = req.body;
    if (!name || !format) { res.status(400).json({ error: "Name and format are required." }); return; }
    if (!["csv", "pdf"].includes(format)) { res.status(400).json({ error: "Format must be csv or pdf." }); return; }

    // Parse params
    const p = params || {};
    const dateFrom = p.dateFrom ? new Date(p.dateFrom) : null;
    const dateTo = p.dateTo ? new Date(p.dateTo) : null;
    const userSegment = p.userSegment || "all"; // all, admin, user

    // Build filters
    const conditions = [];
    if (dateFrom) conditions.push(gte(quizAttempts.startedAt, dateFrom));
    if (dateTo) conditions.push(lte(quizAttempts.startedAt, dateTo));

    const attemptsQuery = db
      .select({
        id: quizAttempts.id,
        userName: users.name,
        userEmail: users.email,
        userRole: users.role,
        startedAt: quizAttempts.startedAt,
        completedAt: quizAttempts.completedAt,
        score: quizAttempts.score,
        totalQuestions: quizAttempts.totalQuestions,
        correctAnswers: quizAttempts.correctAnswers,
        timeSpentSeconds: quizAttempts.timeSpentSeconds,
      })
      .from(quizAttempts)
      .leftJoin(users, eq(quizAttempts.userId, users.id));

    const filteredAttempts = conditions.length > 0
      ? await attemptsQuery.where(and(...conditions)).orderBy(desc(quizAttempts.startedAt))
      : await attemptsQuery.orderBy(desc(quizAttempts.startedAt));

    let finalRows = filteredAttempts;
    if (userSegment !== "all") {
      finalRows = filteredAttempts.filter((a) => a.userRole === userSegment || (!a.userRole && userSegment === "user"));
    }

    // For CSV generate content immediately; for PDF store pending
    let fileContent: string | null = null;
    if (format === "csv") {
      fileContent = generateCSV(finalRows, ["id", "userName", "userEmail", "userRole", "startedAt", "completedAt", "score", "totalQuestions", "correctAnswers", "timeSpentSeconds"]);
    }

    const [report] = await db.insert(reports).values({
      name,
      format,
      status: format === "csv" ? "ready" : "pending",
      params: JSON.stringify(params),
      fileUrl: fileContent,
      createdBy: req.user!.id,
    }).returning();

    res.json({ report });
  } catch (error) {
    console.error("Generate report error:", error);
    res.status(500).json({ error: "Failed to generate report." });
  }
});

router.get("/reports", async (req: AuthRequest, res) => {
  try {
    const allReports = await db
      .select({
        id: reports.id,
        name: reports.name,
        format: reports.format,
        status: reports.status,
        params: reports.params,
        createdAt: reports.createdAt,
        creatorName: users.name,
      })
      .from(reports)
      .leftJoin(users, eq(reports.createdBy, users.id))
      .orderBy(desc(reports.createdAt));
    res.json({ reports: allReports });
  } catch (error) {
    console.error("List reports error:", error);
    res.status(500).json({ error: "Failed to fetch reports." });
  }
});

router.get("/reports/:id/download", async (req: AuthRequest, res) => {
  try {
    const reportId = parseInt(req.params.id as string);
    const [report] = await db.select().from(reports).where(eq(reports.id, reportId));
    if (!report) { res.status(404).json({ error: "Report not found." }); return; }
    if (report.status !== "ready") { res.status(400).json({ error: "Report is not ready yet." }); return; }

    // Log access
    await db.insert(reportAccessLogs).values({
      reportId,
      userId: req.user!.id,
      action: "download",
      ipAddress: req.ip || null,
    });

    if (report.format === "csv" && report.fileUrl) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="${report.name}.csv"`);
      res.send(report.fileUrl);
      return;
    }

    res.status(400).json({ error: "Report format not supported for download." });
  } catch (error) {
    console.error("Download report error:", error);
    res.status(500).json({ error: "Failed to download report." });
  }
});

router.get("/reports/:id/access-logs", async (req: AuthRequest, res) => {
  try {
    if (!requireSuperAdmin(req, res)) return;
    const reportId = parseInt(req.params.id as string);
    const logs = await db
      .select({
        id: reportAccessLogs.id,
        userName: users.name,
        action: reportAccessLogs.action,
        ipAddress: reportAccessLogs.ipAddress,
        createdAt: reportAccessLogs.createdAt,
      })
      .from(reportAccessLogs)
      .leftJoin(users, eq(reportAccessLogs.userId, users.id))
      .where(eq(reportAccessLogs.reportId, reportId))
      .orderBy(desc(reportAccessLogs.createdAt));
    res.json({ logs });
  } catch (error) {
    console.error("Report access logs error:", error);
    res.status(500).json({ error: "Failed to fetch access logs." });
  }
});

export default router;
