import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, cropsTable, farmsTable } from "@workspace/db";
import { requireDbUser } from "../lib/auth";
import {
  ListCropsParams,
  CreateCropParams,
  CreateCropBody,
  GetCropParams,
  UpdateCropParams,
  UpdateCropBody,
  DeleteCropParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// Verify farm belongs to user
async function verifyFarmOwnership(farmId: number, userId: number): Promise<boolean> {
  const [farm] = await db.select().from(farmsTable).where(and(eq(farmsTable.id, farmId), eq(farmsTable.userId, userId)));
  return !!farm;
}

router.get("/farms/:farmId/crops", requireDbUser, async (req, res): Promise<void> => {
  const params = ListCropsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const owned = await verifyFarmOwnership(params.data.farmId, req.dbUserId!);
  if (!owned) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }
  const crops = await db
    .select()
    .from(cropsTable)
    .where(eq(cropsTable.farmId, params.data.farmId))
    .orderBy(cropsTable.createdAt);
  res.json(crops);
});

router.post("/farms/:farmId/crops", requireDbUser, async (req, res): Promise<void> => {
  const params = CreateCropParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const owned = await verifyFarmOwnership(params.data.farmId, req.dbUserId!);
  if (!owned) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }
  const parsed = CreateCropBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [crop] = await db
    .insert(cropsTable)
    .values({ ...parsed.data, farmId: params.data.farmId })
    .returning();
  res.status(201).json(crop);
});

router.get("/crops/:id", requireDbUser, async (req, res): Promise<void> => {
  const params = GetCropParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [crop] = await db
    .select({ crop: cropsTable })
    .from(cropsTable)
    .innerJoin(farmsTable, eq(cropsTable.farmId, farmsTable.id))
    .where(and(eq(cropsTable.id, params.data.id), eq(farmsTable.userId, req.dbUserId!)));
  if (!crop) {
    res.status(404).json({ error: "Crop not found" });
    return;
  }
  res.json(crop.crop);
});

router.put("/crops/:id", requireDbUser, async (req, res): Promise<void> => {
  const params = UpdateCropParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateCropBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  // Verify ownership
  const [existing] = await db
    .select({ crop: cropsTable })
    .from(cropsTable)
    .innerJoin(farmsTable, eq(cropsTable.farmId, farmsTable.id))
    .where(and(eq(cropsTable.id, params.data.id), eq(farmsTable.userId, req.dbUserId!)));
  if (!existing) {
    res.status(404).json({ error: "Crop not found" });
    return;
  }
  const [updated] = await db
    .update(cropsTable)
    .set(parsed.data)
    .where(eq(cropsTable.id, params.data.id))
    .returning();
  res.json(updated);
});

router.delete("/crops/:id", requireDbUser, async (req, res): Promise<void> => {
  const params = DeleteCropParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db
    .select({ crop: cropsTable })
    .from(cropsTable)
    .innerJoin(farmsTable, eq(cropsTable.farmId, farmsTable.id))
    .where(and(eq(cropsTable.id, params.data.id), eq(farmsTable.userId, req.dbUserId!)));
  if (!existing) {
    res.status(404).json({ error: "Crop not found" });
    return;
  }
  await db.delete(cropsTable).where(eq(cropsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
