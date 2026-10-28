import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { AuthController } from "../Modules/auth/auth.controller";

const router = Router();
const controller = new AuthController();

router.post("/auth/signup", controller.signup);
router.post("/auth/login", controller.login);
router.post("/auth/logout", requireAuth, controller.logout);
router.post("/auth/logout-all", requireAuth, controller.logoutAll);

export default router;
