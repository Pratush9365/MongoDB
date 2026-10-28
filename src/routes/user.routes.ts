import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { UserController } from "../Modules/user/user.controller";

const router = Router();
const controller = new UserController();

router.get("/users/me", requireAuth, controller.getMe);
router.patch("/users/me", requireAuth, controller.updateMe);

export default router;
