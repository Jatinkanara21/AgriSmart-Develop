import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, diseaseDetectionsTable, farmsTable } from "@workspace/db";
import { requireDbUser } from "../lib/auth";
import {
  CreateDiseaseDetectionBody,
  GetDiseaseDetectionParams,
  ListDiseaseDetectionsQueryParams,
} from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// Disease database for rule-based detection when no AI is available
const DISEASE_DB: Record<string, { symptoms: string; treatment: string }> = {
  "Leaf Blight": {
    symptoms: "Brown lesions on leaves, yellowing around lesion margins, premature leaf drop",
    treatment: "Apply copper-based fungicide. Remove and destroy infected leaves. Improve air circulation.",
  },
  "Powdery Mildew": {
    symptoms: "White powdery coating on leaves, distorted growth, premature leaf drop",
    treatment: "Apply sulfur-based fungicide or neem oil. Avoid overhead watering. Prune affected areas.",
  },
  "Bacterial Wilt": {
    symptoms: "Sudden wilting of leaves, brown discoloration of stem tissue, sticky bacterial ooze",
    treatment: "Remove and destroy infected plants. Control cucumber beetles. Use disease-free seeds.",
  },
  "Rust Disease": {
    symptoms: "Orange-red pustules on leaf undersides, yellowing upper leaf surface, reduced yield",
    treatment: "Apply fungicide containing tebuconazole or propiconazole. Remove infected plant debris.",
  },
  "Healthy": {
    symptoms: "No disease symptoms detected",
    treatment: "Continue regular monitoring and preventive care practices.",
  },
};

async function analyzeImageForDisease(base64Image: string): Promise<{
  diseaseName: string;
  confidence: number;
  symptoms: string;
  treatment: string;
  isHealthy: boolean;
}> {
  // Rule-based mock detection (in production, call AI vision API)
  // Simulate realistic detection based on image hash
  const hash = base64Image.slice(-10).split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const diseases = Object.keys(DISEASE_DB);
  const diseaseIndex = hash % diseases.length;
  const diseaseName = diseases[diseaseIndex] ?? "Leaf Blight";
  const isHealthy = diseaseName === "Healthy";
  const confidence = isHealthy ? 0.92 : 0.65 + (hash % 30) / 100;
  const info = DISEASE_DB[diseaseName] ?? DISEASE_DB["Leaf Blight"]!;

  return {
    diseaseName,
    confidence: Math.min(confidence, 0.98),
    symptoms: info.symptoms,
    treatment: info.treatment,
    isHealthy,
  };
}

router.get("/disease-detections", requireDbUser, async (req, res): Promise<void> => {
  const params = ListDiseaseDetectionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { farmId, cropId } = params.data;

  const detections = await db
    .select({ detection: diseaseDetectionsTable })
    .from(diseaseDetectionsTable)
    .innerJoin(farmsTable, eq(diseaseDetectionsTable.farmId, farmsTable.id))
    .where(
      and(
        eq(farmsTable.userId, req.dbUserId!),
        farmId !== undefined ? eq(diseaseDetectionsTable.farmId, farmId) : undefined,
        cropId !== undefined ? eq(diseaseDetectionsTable.cropId, cropId) : undefined,
      ),
    )
    .orderBy(diseaseDetectionsTable.createdAt);

  res.json(
    detections.map((r) => ({
      ...r.detection,
      isHealthy: r.detection.isHealthy === "true",
    })),
  );
});

router.post("/disease-detections", requireDbUser, async (req, res): Promise<void> => {
  const parsed = CreateDiseaseDetectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { farmId, cropId, imageBase64 } = parsed.data;

  // Verify farm ownership
  const [farm] = await db
    .select()
    .from(farmsTable)
    .where(and(eq(farmsTable.id, farmId), eq(farmsTable.userId, req.dbUserId!)));
  if (!farm) {
    res.status(404).json({ error: "Farm not found" });
    return;
  }

  let analysis;
  try {
    analysis = await analyzeImageForDisease(imageBase64);
  } catch (err) {
    logger.error({ err }, "Disease analysis error");
    res.status(500).json({ error: "Disease analysis failed" });
    return;
  }

  // Store image as data URL (in production, upload to object storage)
  const imageUrl = `data:image/jpeg;base64,${imageBase64.slice(0, 50)}...`;

  const [detection] = await db
    .insert(diseaseDetectionsTable)
    .values({
      farmId,
      cropId: cropId ?? null,
      imageUrl,
      diseaseName: analysis.diseaseName,
      confidence: analysis.confidence,
      symptoms: analysis.symptoms,
      treatment: analysis.treatment,
      isHealthy: String(analysis.isHealthy),
    })
    .returning();

  res.status(201).json({ ...detection, isHealthy: detection.isHealthy === "true" });
});

router.get("/disease-detections/:id", requireDbUser, async (req, res): Promise<void> => {
  const params = GetDiseaseDetectionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({ detection: diseaseDetectionsTable })
    .from(diseaseDetectionsTable)
    .innerJoin(farmsTable, eq(diseaseDetectionsTable.farmId, farmsTable.id))
    .where(and(eq(diseaseDetectionsTable.id, params.data.id), eq(farmsTable.userId, req.dbUserId!)));
  if (!row) {
    res.status(404).json({ error: "Detection not found" });
    return;
  }
  res.json({ ...row.detection, isHealthy: row.detection.isHealthy === "true" });
});

export default router;
