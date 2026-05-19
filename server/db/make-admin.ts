import { db } from "./index";
import { users } from "./schema";
import { eq } from "drizzle-orm";

async function main() {
  const [updated] = await db
    .update(users)
    .set({ role: "admin" })
    .where(eq(users.email, "testuser@example.com"))
    .returning();
  console.log("Updated user:", updated);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
