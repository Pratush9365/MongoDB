import { Router } from "express";
import authRoutes from "./auth.routes";
import commentRoutes from "./comment.routes";
import docsRoutes from "./docs.routes";
import healthRoutes from "./health.routes";
import postRoutes from "./post.routes";
import statsRoutes from "./stats.routes";
import userRoutes from "./user.routes";

/** Every router is registered here and mounted under /api by app.ts. */
const router = Router();

router.use(healthRoutes);
router.use(docsRoutes);
router.use(authRoutes);
router.use(userRoutes);
router.use(postRoutes);
router.use(commentRoutes);
router.use(statsRoutes);

export default router;
