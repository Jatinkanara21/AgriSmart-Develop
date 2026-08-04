import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, expensesTable, farmsTable } from "@workspace/db";
import { requireDbUser } from "../lib/auth";
import {
  CreateExpenseBody,
  UpdateExpenseBody,
  GetExpenseParams,
  UpdateExpenseParams,
  DeleteExpenseParams,
  ListExpensesQueryParams,
  GetExpenseSummaryQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/expenses", requireDbUser, async (req, res): Promise<void> => {
  const params = ListExpensesQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { farmId, cropId, category, from, to } = params.data;

  let query = db
    .select({ expense: expensesTable })
    .from(expensesTable)
    .innerJoin(farmsTable, eq(expensesTable.farmId, farmsTable.id))
    .where(eq(farmsTable.userId, req.dbUserId!));

  const expenses = await db
    .select({ expense: expensesTable })
    .from(expensesTable)
    .innerJoin(farmsTable, eq(expensesTable.farmId, farmsTable.id))
    .where(
      and(
        eq(farmsTable.userId, req.dbUserId!),
        farmId !== undefined ? eq(expensesTable.farmId, farmId) : undefined,
        cropId !== undefined ? eq(expensesTable.cropId, cropId) : undefined,
        category !== undefined ? eq(expensesTable.category, category) : undefined,
        from !== undefined ? gte(expensesTable.date, from) : undefined,
        to !== undefined ? lte(expensesTable.date, to) : undefined,
      ),
    )
    .orderBy(expensesTable.date);
  res.json(expenses.map((r) => r.expense));
});

router.get("/expenses/summary", requireDbUser, async (req, res): Promise<void> => {
  const params = GetExpenseSummaryQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const { farmId, year } = params.data;
  const targetYear = year ?? new Date().getFullYear();

  const expenses = await db
    .select({ expense: expensesTable })
    .from(expensesTable)
    .innerJoin(farmsTable, eq(expensesTable.farmId, farmsTable.id))
    .where(
      and(
        eq(farmsTable.userId, req.dbUserId!),
        farmId !== undefined ? eq(expensesTable.farmId, farmId) : undefined,
        sql`EXTRACT(YEAR FROM ${expensesTable.date}::date) = ${targetYear}`,
      ),
    );

  const all = expenses.map((r) => r.expense);

  const monthMap: Record<string, number> = {};
  const categoryMap: Record<string, number> = {};
  let totalYear = 0;

  for (const e of all) {
    const month = e.date.slice(0, 7); // YYYY-MM
    monthMap[month] = (monthMap[month] ?? 0) + e.amount;
    categoryMap[e.category] = (categoryMap[e.category] ?? 0) + e.amount;
    totalYear += e.amount;
  }

  const byMonth = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));

  const byCategory = Object.entries(categoryMap).map(([category, total]) => ({ category, total }));

  res.json({ totalYear, byMonth, byCategory });
});

router.get("/expenses/:id", requireDbUser, async (req, res): Promise<void> => {
  const params = GetExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [row] = await db
    .select({ expense: expensesTable })
    .from(expensesTable)
    .innerJoin(farmsTable, eq(expensesTable.farmId, farmsTable.id))
    .where(and(eq(expensesTable.id, params.data.id), eq(farmsTable.userId, req.dbUserId!)));
  if (!row) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  res.json(row.expense);
});

router.post("/expenses", requireDbUser, async (req, res): Promise<void> => {
  const parsed = CreateExpenseBody.safeParse(req.body);
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
  const [expense] = await db.insert(expensesTable).values(parsed.data).returning();
  res.status(201).json(expense);
});

router.put("/expenses/:id", requireDbUser, async (req, res): Promise<void> => {
  const params = UpdateExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateExpenseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [existing] = await db
    .select({ expense: expensesTable })
    .from(expensesTable)
    .innerJoin(farmsTable, eq(expensesTable.farmId, farmsTable.id))
    .where(and(eq(expensesTable.id, params.data.id), eq(farmsTable.userId, req.dbUserId!)));
  if (!existing) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  const [updated] = await db.update(expensesTable).set(parsed.data).where(eq(expensesTable.id, params.data.id)).returning();
  res.json(updated);
});

router.delete("/expenses/:id", requireDbUser, async (req, res): Promise<void> => {
  const params = DeleteExpenseParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [existing] = await db
    .select({ expense: expensesTable })
    .from(expensesTable)
    .innerJoin(farmsTable, eq(expensesTable.farmId, farmsTable.id))
    .where(and(eq(expensesTable.id, params.data.id), eq(farmsTable.userId, req.dbUserId!)));
  if (!existing) {
    res.status(404).json({ error: "Expense not found" });
    return;
  }
  await db.delete(expensesTable).where(eq(expensesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
