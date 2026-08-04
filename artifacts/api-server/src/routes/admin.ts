import { Router, type IRouter } from "express";
import { eq, count } from "drizzle-orm";
import { db, usersTable, farmsTable } from "@workspace/db";
import { requireDbUser, requireAdmin } from "../lib/auth";
import { AdminUpdateUserRoleParams, AdminUpdateUserRoleBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/users", requireDbUser, requireAdmin, async (req, res): Promise<void> => {
  const users = await db
    .select({
      id: usersTable.id,
      clerkId: usersTable.clerkId,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
      farmsCount: count(farmsTable.id),
    })
    .from(usersTable)
    .leftJoin(farmsTable, eq(farmsTable.userId, usersTable.id))
    .groupBy(usersTable.id)
    .orderBy(usersTable.createdAt);

  res.json(users);
});

router.put("/admin/users/:id/role", requireDbUser, requireAdmin, async (req, res): Promise<void> => {
  const params = AdminUpdateUserRoleParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = AdminUpdateUserRoleBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // id here is the DB user id (as string from path param, need to coerce)
  const dbId = parseInt(params.data.id, 10);
  if (isNaN(dbId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  const [updated] = await db
    .update(usersTable)
    .set({ role: parsed.data.role })
    .where(eq(usersTable.id, dbId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({
    id: updated.id,
    clerkId: updated.clerkId,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    createdAt: updated.createdAt,
    farmsCount: 0,
  });
});

export default router;
