import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  const [updated] = await db
    .update(users)
    .set({ role: "super_admin" })
    .where(eq(users.email, "testuser@example.com"))
    .returning();
  console.log("Updated user to super_admin:", updated);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
