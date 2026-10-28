import { Router } from "express";
import authRoutes from "./auth.routes";
import healthRoutes from "./health.routes";
import userRoutes from "./user.routes";

/** Every router is registered here and mounted under /api by app.ts. */
const router = Router();

router.use(healthRoutes);
router.use(authRoutes);
router.use(userRoutes);

export default router;
