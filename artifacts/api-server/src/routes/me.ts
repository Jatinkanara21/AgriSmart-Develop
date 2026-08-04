import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireDbUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/me", requireDbUser, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.dbUserId!));
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    clerkId: user.clerkId,
    email: user.email,
    name: user.name,
    phone: user.phone,
    state: user.state,
    role: user.role,
    createdAt: user.createdAt,
  });
});

router.put("/me", requireDbUser, async (req, res): Promise<void> => {
  const { name, phone, state } = req.body as { name?: string; phone?: string; state?: string };
  const [updated] = await db
    .update(usersTable)
    .set({ name, phone, state })
    .where(eq(usersTable.id, req.dbUserId!))
    .returning();
  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    email: updated.email,
    name: updated.name,
    phone: updated.phone,
    state: updated.state,
    role: updated.role,
    createdAt: updated.createdAt,
  });
});

export default router;
