import { Router } from "express";
import { asyncHandler } from "../middlewares/validation.middleware";
import { StatsController } from "../Modules/stats/stats.controller";

const router = Router();
const controller = new StatsController();

router.get("/stats", asyncHandler(controller.getStats));

export default router;
