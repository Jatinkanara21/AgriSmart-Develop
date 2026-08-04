import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmsTable } from "./farms";

export const fertilizerRecommendationsTable = pgTable("fertilizer_recommendations", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farmsTable.id, { onDelete: "cascade" }),
  soilType: text("soil_type").notNull(),
  nitrogen: real("nitrogen").notNull(),
  phosphorus: real("phosphorus").notNull(),
  potassium: real("potassium").notNull(),
  ph: real("ph").notNull(),
  cropName: text("crop_name"),
  fertilizerName: text("fertilizer_name").notNull(),
  dosage: text("dosage").notNull(),
  schedule: text("schedule").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertFertilizerRecommendationSchema = createInsertSchema(fertilizerRecommendationsTable).omit({ id: true, createdAt: true });
export type InsertFertilizerRecommendation = z.infer<typeof insertFertilizerRecommendationSchema>;
export type FertilizerRecommendation = typeof fertilizerRecommendationsTable.$inferSelect;
