import { Router } from "express";
import { HealthController } from "../Modules/health/health.controller";

const router = Router();
const controller = new HealthController();

router.get("/health", controller.check);

export default router;
