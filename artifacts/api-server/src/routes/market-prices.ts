import { Router, type IRouter } from "express";
import { eq, and, gte, lte, ilike } from "drizzle-orm";
import { db, marketPricesTable } from "@workspace/db";
import { requireDbUser } from "../lib/auth";
import { ListMarketPricesQueryParams, ListPricePredictionsQueryParams } from "@workspace/api-zod";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/market-prices", requireDbUser, async (req, res): Promise<void> => {
  const params = ListMarketPricesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { crop, state, market, date } = params.data;

  const prices = await db
    .select()
    .from(marketPricesTable)
    .where(
      and(
        crop !== undefined ? ilike(marketPricesTable.cropName, `%${crop}%`) : undefined,
        state !== undefined ? ilike(marketPricesTable.state, `%${state}%`) : undefined,
        market !== undefined ? ilike(marketPricesTable.market, `%${market}%`) : undefined,
        date !== undefined ? eq(marketPricesTable.date, date) : undefined,
      ),
    )
    .orderBy(marketPricesTable.date, marketPricesTable.cropName)
    .limit(200);

  res.json(prices);
});

router.get("/market-prices/crops", requireDbUser, async (req, res): Promise<void> => {
  const crops = await db
    .selectDistinct({ cropName: marketPricesTable.cropName })
    .from(marketPricesTable)
    .orderBy(marketPricesTable.cropName);
  res.json(crops.map((c) => c.cropName));
});

router.get("/market-prices/predictions", requireDbUser, async (req, res): Promise<void> => {
  const params = ListPricePredictionsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { crop } = params.data;

  // Get last 6 months of data for trend analysis
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const fromDate = sixMonthsAgo.toISOString().slice(0, 10);

  const historical = await db
    .select()
    .from(marketPricesTable)
    .where(and(ilike(marketPricesTable.cropName, `%${crop}%`), gte(marketPricesTable.date, fromDate)))
    .orderBy(marketPricesTable.date);

  if (historical.length === 0) {
    res.status(404).json({ error: "No price data found for this crop" });
    return;
  }

  const histData = historical.map((p) => ({ date: p.date, price: p.modalPrice }));

  // Simple linear trend prediction for next 3 months
  const n = histData.length;
  const avgPrice = histData.reduce((sum, d) => sum + d.price, 0) / n;

  // Calculate trend slope
  const xMean = (n - 1) / 2;
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (i - xMean) * ((histData[i]?.price ?? 0) - avgPrice);
    denominator += (i - xMean) ** 2;
  }
  const slope = denominator > 0 ? numerator / denominator : 0;

  // Generate 90-day predictions
  const lastDate = new Date(histData[histData.length - 1]?.date ?? new Date());
  const predicted = [];
  for (let i = 1; i <= 90; i += 10) {
    const d = new Date(lastDate);
    d.setDate(d.getDate() + i);
    const forecastPrice = Math.max(0, avgPrice + slope * (n + i / 10));
    predicted.push({
      date: d.toISOString().slice(0, 10),
      price: Math.round(forecastPrice * 100) / 100,
      isForecasted: true,
    });
  }

  // Best selling month based on historical data
  const monthlyAvg: Record<string, { total: number; count: number }> = {};
  for (const d of histData) {
    const month = d.date.slice(0, 7);
    monthlyAvg[month] = monthlyAvg[month] ?? { total: 0, count: 0 };
    monthlyAvg[month]!.total += d.price;
    monthlyAvg[month]!.count += 1;
  }
  const bestMonth = Object.entries(monthlyAvg).sort(
    ([, a], [, b]) => b.total / b.count - a.total / a.count,
  )[0]?.[0] ?? "N/A";

  const trend: "rising" | "falling" | "stable" =
    Math.abs(slope) < 0.5 ? "stable" : slope > 0 ? "rising" : "falling";

  res.json({
    cropName: crop,
    historical: histData,
    predicted: [...histData.map((d) => ({ ...d, isForecasted: false })), ...predicted],
    bestSellingMonth: bestMonth,
    trend,
    avgPrice: Math.round(avgPrice * 100) / 100,
  });
});

export default router;
