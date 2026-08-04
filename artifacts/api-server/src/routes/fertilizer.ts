import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, fertilizerRecommendationsTable, farmsTable } from "@workspace/db";
import { requireDbUser } from "../lib/auth";
import {
  CreateFertilizerRecommendationBody,
  GetFertilizerRecommendationParams,
  ListFertilizerRecommendationsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

interface FertilizerResult {
  fertilizerName: string;
  dosage: string;
  schedule: string;
  notes: string;
}

// Rule-based fertilizer recommendation engine
function recommendFertilizer(input: {
  soilType: string;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  cropName?: string | null;
}): FertilizerResult {
  const { nitrogen, phosphorus, potassium, ph, soilType, cropName } = input;

  // Determine NPK deficiencies
  const lowN = nitrogen < 40;
  const lowP = phosphorus < 25;
  const lowK = potassium < 40;

  let fertilizerName: string;
  let dosage: string;
  let schedule: string;
  let notes: string;

  if (lowN && lowP && lowK) {
    fertilizerName = "NPK 10-26-26 Complex Fertilizer";
    dosage = "100-150 kg/acre";
    schedule = "Apply at planting as basal dose. Top dress with urea at 30 and 60 days.";
  } else if (lowN && lowP) {
    fertilizerName = "DAP (Di-Ammonium Phosphate)";
    dosage = "50-75 kg/acre";
    schedule = "Apply 50% at sowing as basal dose, remaining 50% at 30-40 days after sowing.";
  } else if (lowN && lowK) {
    fertilizerName = "NPK 20-0-20 + Urea";
    dosage = "75-100 kg/acre";
    schedule = "Split into 3 equal doses: at planting, 30 days, and 60 days after sowing.";
  } else if (lowP && lowK) {
    fertilizerName = "SSP (Single Super Phosphate) + MOP";
    dosage = "SSP 50 kg + MOP 30 kg per acre";
    schedule = "Apply as basal dose before sowing. Incorporate into soil.";
  } else if (lowN) {
    fertilizerName = "Urea (46% Nitrogen)";
    dosage = "35-50 kg/acre";
    schedule = "Split application: 50% at sowing, 25% at 30 days, 25% at 60 days.";
  } else if (lowP) {
    fertilizerName = "SSP (Single Super Phosphate)";
    dosage = "60-80 kg/acre";
    schedule = "Apply as basal dose before planting. Mix well into top 15 cm of soil.";
  } else if (lowK) {
    fertilizerName = "MOP (Muriate of Potash)";
    dosage = "30-40 kg/acre";
    schedule = "Apply 50% as basal dose, 50% at first top dressing (30 days after sowing).";
  } else {
    fertilizerName = "Vermicompost / Organic Matter";
    dosage = "500-1000 kg/acre";
    schedule = "Apply 2-3 weeks before sowing. Mix thoroughly with soil.";
  }

  // pH adjustments
  const phNotes: string[] = [];
  if (ph < 5.5) {
    phNotes.push("Apply agricultural lime (250-500 kg/acre) to raise pH before fertilizing.");
  } else if (ph > 8.0) {
    phNotes.push("Apply gypsum (100-200 kg/acre) to lower pH. Avoid ammonium-based fertilizers.");
  }

  // Soil-specific notes
  if (soilType === "sandy") {
    phNotes.push("Sandy soil has low water retention. Apply fertilizers in split doses to minimize leaching.");
  } else if (soilType === "clay") {
    phNotes.push("Clay soil has high nutrient retention. Ensure good drainage before applying.");
  }

  if (cropName) {
    phNotes.push(`Recommendation optimized for ${cropName} cultivation.`);
  }

  notes = phNotes.join(" ") || "Ensure adequate soil moisture before applying fertilizers.";

  return { fertilizerName, dosage, schedule, notes };
}

router.get("/fertilizer-recommendations", requireDbUser, async (req, res): Promise<void> => {
  const params = ListFertilizerRecommendationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { farmId } = params.data;

  const recs = await db
    .select({ rec: fertilizerRecommendationsTable })
    .from(fertilizerRecommendationsTable)
    .innerJoin(farmsTable, eq(fertilizerRecommendationsTable.farmId, farmsTable.id))
    .where(
      and(
        eq(farmsTable.userId, req.dbUserId!),
        farmId !== undefined ? eq(fertilizerRecommendationsTable.farmId, farmId) : undefined,
      ),
    )
    .orderBy(fertilizerRecommendationsTable.createdAt);

  res.json(recs.map((r) => r.rec));
});

router.post("/fertilizer-recommendations", requireDbUser, async (req, res): Promise<void> => {
  const parsed = CreateFertilizerRecommendationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Verify farm ownership
  const [farm] = await db
    .select()
    .from(farmsTable)
    .where(and(eq(farmsTable.id, parsed.data.farmId), eq(farmsTable.userId, req.dbUserId!)));
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  const result = recommendFertilizer(parsed.data);

  const [rec] = await db
    .insert(fertilizerRecommendationsTable)
    .values({
      farmId: parsed.data.farmId,
      soilType: parsed.data.soilType,
      nitrogen: parsed.data.nitrogen,
      phosphorus: parsed.data.phosphorus,
      potassium: parsed.data.potassium,
      ph: parsed.data.ph,
      cropName: parsed.data.cropName ?? null,
      fertilizerName: result.fertilizerName,
      dosage: result.dosage,
      schedule: result.schedule,
      notes: result.notes,
    })
    .returning();

  res.status(201).json(rec);
});

router.get("/fertilizer-recommendations/:id", requireDbUser, async (req, res): Promise<void> => {
  const params = GetFertilizerRecommendationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({ rec: fertilizerRecommendationsTable })
    .from(fertilizerRecommendationsTable)
    .innerJoin(farmsTable, eq(fertilizerRecommendationsTable.farmId, farmsTable.id))
    .where(and(eq(fertilizerRecommendationsTable.id, params.data.id), eq(farmsTable.userId, req.dbUserId!)));
  if (!row) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }
  res.json(row.rec);
});

export default router;
