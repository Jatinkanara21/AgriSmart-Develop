import { Router } from "express";
import healthRouter from "./health";
import meRouter from "./me";
import farmsRouter from "./farms";
import cropsRouter from "./crops";
import expensesRouter from "./expenses";
import diseaseRouter from "./disease";
import fertilizerRouter from "./fertilizer";
import marketPricesRouter from "./market-prices";
import weatherRouter from "./weather";
import dashboardRouter from "./dashboard";
import adminRouter from "./admin";

const router = Router();

router.use(healthRouter);
router.use(meRouter);
router.use(farmsRouter);
router.use(cropsRouter);
router.use(expensesRouter);
router.use(diseaseRouter);
router.use(fertilizerRouter);
router.use(marketPricesRouter);
router.use(weatherRouter);
router.use(dashboardRouter);
router.use(adminRouter);

export default router;
