import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/validation.middleware";
import { PostController } from "../Modules/post/post.controller";
import { UserController } from "../Modules/user/user.controller";

const router = Router();
const users = new UserController();
const posts = new PostController();

router.get("/users/me", requireAuth, asyncHandler(users.getMe));
router.patch("/users/me", requireAuth, asyncHandler(users.updateMe));
router.get("/users/me/posts", requireAuth, asyncHandler(posts.listMine));

export default router;
