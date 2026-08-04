import { pgTable, text, serial, real, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const marketPricesTable = pgTable("market_prices", {
  id: serial("id").primaryKey(),
  cropName: text("crop_name").notNull(),
  variety: text("variety"),
  state: text("state").notNull(),
  market: text("market").notNull(),
  minPrice: real("min_price").notNull(),
  maxPrice: real("max_price").notNull(),
  modalPrice: real("modal_price").notNull(),
  unit: text("unit").notNull().default("Quintal"),
  date: date("date", { mode: "string" }).notNull(),
});

export const insertMarketPriceSchema = createInsertSchema(marketPricesTable).omit({ id: true });
export type InsertMarketPrice = z.infer<typeof insertMarketPriceSchema>;
export type MarketPrice = typeof marketPricesTable.$inferSelect;
