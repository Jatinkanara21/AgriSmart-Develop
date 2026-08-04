import { pgTable, text, serial, timestamp, integer, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { farmsTable } from "./farms";

export const cropsTable = pgTable("crops", {
  id: serial("id").primaryKey(),
  farmId: integer("farm_id").notNull().references(() => farmsTable.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  variety: text("variety"),
  status: text("status").notNull().default("planned"),
  plantingDate: date("planting_date", { mode: "string" }).notNull(),
  harvestDate: date("harvest_date", { mode: "string" }),
  expectedYield: real("expected_yield"),
  actualYield: real("actual_yield"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertCropSchema = createInsertSchema(cropsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertCrop = z.infer<typeof insertCropSchema>;
export type Crop = typeof cropsTable.$inferSelect;
