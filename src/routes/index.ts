import { Router } from "express";
import healthRoutes from "./health.routes";

/** Every router is registered here and mounted under /api by app.ts. */
const router = Router();

router.use(healthRoutes);

export default router;
