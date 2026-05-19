import "dotenv/config";
import { db } from "./index";
import { quizzes, users } from "./schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function seed() {
  console.log("Seeding database...");

  // Seed quiz if none exist
  const existingQuizzes = await db.select().from(quizzes);
  if (existingQuizzes.length === 0) {
    await db.insert(quizzes).values({
      title: "TKDN Compliance Assessment",
      description: "Test your knowledge of Indonesian Ministry of Industry Regulations, specifically Peraturan Menteri Perindustrian No. 35 Tahun 2025 regarding TKDN and BMP.",
      category: "Compliance",
      totalQuestions: 25,
      active: true,
    });
    console.log("Seeded initial quiz.");
  } else {
    console.log("Quizzes already seeded.");
  }

  // Seed admin users if they don't exist
  const seededUsers = [
    {
      email: "superadmin@example.com",
      password: "superadmin123",
      name: "Super Admin",
      role: "super_admin" as const,
    },
    {
      email: "admin@example.com",
      password: "admin123",
      name: "Admin User",
      role: "admin" as const,
    },
    {
      email: "user@example.com",
      password: "user123",
      name: "Standard User",
      role: "user" as const,
    },
  ];

  for (const u of seededUsers) {
    const existing = await db.select().from(users).where(eq(users.email, u.email));
    if (existing.length === 0) {
      const passwordHash = await bcrypt.hash(u.password, 10);
      await db.insert(users).values({
        email: u.email,
        passwordHash,
        name: u.name,
        role: u.role,
      });
      console.log(`Seeded ${u.role}: ${u.email} / ${u.password}`);
    } else {
      console.log(`User ${u.email} already exists.`);
    }
  }

  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
