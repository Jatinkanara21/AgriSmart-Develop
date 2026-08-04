import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmsTable } from "./farms";
import { cropsTable } from "./crops";

export const diseaseDetectionsTable = pgTable("disease_detections", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farmsTable.id, { onDelete: "cascade" }),
  cropId: integer("crop_id").references(() => cropsTable.id, { onDelete: "set null" }),
  imageUrl: text("image_url").notNull(),
  diseaseName: text("disease_name").notNull(),
  confidence: real("confidence").notNull(),
  symptoms: text("symptoms").notNull(),
  treatment: text("treatment").notNull(),
  isHealthy: text("is_healthy").notNull().default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDiseaseDetectionSchema = createInsertSchema(diseaseDetectionsTable).omit({ id: true, createdAt: true });
export type InsertDiseaseDetection = z.infer<typeof insertDiseaseDetectionSchema>;
export type DiseaseDetection = typeof diseaseDetectionsTable.$inferSelect;
