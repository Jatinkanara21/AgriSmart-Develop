import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, farmsTable, cropsTable } from "@workspace/db";
import { requireDbUser } from "../lib/auth";
import { CreateFarmBody, UpdateFarmBody, GetFarmParams, UpdateFarmParams, DeleteFarmParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/farms", requireDbUser, async (req, res): Promise<void> => {
  const farms = await db
    .select({
      id: farmsTable.id,
      userId: farmsTable.userId,
      name: farmsTable.name,
      location: farmsTable.location,
      area: farmsTable.area,
      soilType: farmsTable.soilType,
      description: farmsTable.description,
      createdAt: farmsTable.createdAt,
      cropsCount: sql<number>`(SELECT COUNT(*) FROM ${cropsTable} WHERE ${cropsTable.farmId} = ${farmsTable.id})`.mapWith(Number),
    })
    .from(farmsTable)
    .where(eq(farmsTable.userId, req.dbUserId!))
    .orderBy(farmsTable.createdAt);
  res.json(farms);
});

router.post("/farms", requireDbUser, async (req, res): Promise<void> => {
  const parsed = CreateFarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [farm] = await db
    .insert(farmsTable)
    .values({ ...parsed.data, userId: req.dbUserId! })
    .returning();
  res.status(201).json({ ...farm, cropsCount: 0 });
});

router.get("/farms/:id", requireDbUser, async (req, res): Promise<void> => {
  const params = GetFarmParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [farm] = await db
    .select({
      id: farmsTable.id,
      userId: farmsTable.userId,
      name: farmsTable.name,
      location: farmsTable.location,
      area: farmsTable.area,
      soilType: farmsTable.soilType,
      description: farmsTable.description,
      createdAt: farmsTable.createdAt,
      cropsCount: sql<number>`(SELECT COUNT(*) FROM ${cropsTable} WHERE ${cropsTable.farmId} = ${farmsTable.id})`.mapWith(Number),
    })
    .from(farmsTable)
    .where(and(eq(farmsTable.id, params.data.id), eq(farmsTable.userId, req.dbUserId!)));
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }
  res.json(farm);
});

router.put("/farms/:id", requireDbUser, async (req, res): Promise<void> => {
  const params = UpdateFarmParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateFarmBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [farm] = await db
    .update(farmsTable)
    .set(parsed.data)
    .where(and(eq(farmsTable.id, params.data.id), eq(farmsTable.userId, req.dbUserId!)))
    .returning();
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }
  res.json({ ...farm, cropsCount: 0 });
});

router.delete("/farms/:id", requireDbUser, async (req, res): Promise<void> => {
  const params = DeleteFarmParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [farm] = await db
    .delete(farmsTable)
    .where(and(eq(farmsTable.id, params.data.id), eq(farmsTable.userId, req.dbUserId!)))
    .returning();
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }
  res.sendStatus(204);
});

export default router;
