import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/validation.middleware";
import { AuthController } from "../Modules/auth/auth.controller";

const router = Router();
const controller = new AuthController();

router.post("/auth/signup", asyncHandler(controller.signup));
router.post("/auth/login", asyncHandler(controller.login));
router.post("/auth/logout", requireAuth, asyncHandler(controller.logout));
router.post("/auth/logout-all", requireAuth, asyncHandler(controller.logoutAll));

export default router;
