import { Router, type IRouter } from "express";
import { eq, count, sum, and, gte } from "drizzle-orm";
import { db, farmsTable, cropsTable, expensesTable, diseaseDetectionsTable } from "@workspace/db";
import { requireDbUser } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard", requireDbUser, async (req, res): Promise<void> => {
  const userId = req.dbUserId!;

  // Parallel fetch all dashboard data
  const [
    farmsResult,
    cropsResult,
    activeCropsResult,
    expensesResult,
    categoryResult,
    recentDetections,
    upcomingHarvests,
  ] = await Promise.all([
    // Total farms
    db.select({ count: count() }).from(farmsTable).where(eq(farmsTable.userId, userId)),

    // Total crops
    db
      .select({ count: count() })
      .from(cropsTable)
      .innerJoin(farmsTable, eq(cropsTable.farmId, farmsTable.id))
      .where(eq(farmsTable.userId, userId)),

    // Active crops (growing)
    db
      .select({ count: count() })
      .from(cropsTable)
      .innerJoin(farmsTable, eq(cropsTable.farmId, farmsTable.id))
      .where(and(eq(farmsTable.userId, userId), eq(cropsTable.status, "growing"))),

    // Total expenses this year
    db
      .select({ total: sum(expensesTable.amount) })
      .from(expensesTable)
      .innerJoin(farmsTable, eq(expensesTable.farmId, farmsTable.id))
      .where(eq(farmsTable.userId, userId)),

    // Expenses by category
    db
      .select({ category: expensesTable.category, total: sum(expensesTable.amount) })
      .from(expensesTable)
      .innerJoin(farmsTable, eq(expensesTable.farmId, farmsTable.id))
      .where(eq(farmsTable.userId, userId))
      .groupBy(expensesTable.category),

    // Recent disease detections (last 5)
    db
      .select({ detection: diseaseDetectionsTable })
      .from(diseaseDetectionsTable)
      .innerJoin(farmsTable, eq(diseaseDetectionsTable.farmId, farmsTable.id))
      .where(eq(farmsTable.userId, userId))
      .orderBy(diseaseDetectionsTable.createdAt)
      .limit(5),

    // Upcoming harvests (next 30 days)
    db
      .select({
        cropId: cropsTable.id,
        cropName: cropsTable.name,
        farmName: farmsTable.name,
        harvestDate: cropsTable.harvestDate,
      })
      .from(cropsTable)
      .innerJoin(farmsTable, eq(cropsTable.farmId, farmsTable.id))
      .where(
        and(
          eq(farmsTable.userId, userId),
          eq(cropsTable.status, "growing"),
          gte(cropsTable.harvestDate, new Date().toISOString().slice(0, 10)),
        ),
      )
      .orderBy(cropsTable.harvestDate)
      .limit(5),
  ]);

  const totalExpenses = Number(expensesResult[0]?.total ?? 0);
  const totalFarms = farmsResult[0]?.count ?? 0;
  const totalCrops = cropsResult[0]?.count ?? 0;
  const activeCrops = activeCropsResult[0]?.count ?? 0;

  const expenseByCategory = categoryResult.map((r) => ({
    category: r.category,
    total: Number(r.total ?? 0),
  }));

  // Estimated profit: assume 3x ROI for growing crops (simplified)
  const estimatedProfit = totalExpenses * 2.5;

  // Recent alerts from disease detections
  const recentAlerts = recentDetections
    .filter((r) => r.detection.isHealthy !== "true")
    .slice(0, 5)
    .map((r) => ({
      id: r.detection.id,
      type: "disease" as const,
      message: `${r.detection.diseaseName} detected (${Math.round(r.detection.confidence * 100)}% confidence)`,
      createdAt: r.detection.createdAt,
    }));

  const detectionsFull = recentDetections.map((r) => ({
    ...r.detection,
    isHealthy: r.detection.isHealthy === "true",
  }));

  const harvests = upcomingHarvests
    .filter((h) => h.harvestDate !== null)
    .map((h) => ({
      cropId: h.cropId,
      cropName: h.cropName,
      farmName: h.farmName,
      harvestDate: h.harvestDate as string,
    }));

  res.json({
    totalFarms,
    activeCrops,
    totalCrops,
    totalExpenses,
    estimatedProfit,
    recentAlerts,
    expenseByCategory,
    recentDiseaseDetections: detectionsFull,
    upcomingHarvests: harvests,
  });
});

export default router;
