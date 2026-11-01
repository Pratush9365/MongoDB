import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/validation.middleware";
import { CommentController } from "../Modules/comment/comment.controller";

const router = Router();
const comments = new CommentController();

router.delete("/comments/:id", requireAuth, asyncHandler(comments.remove));

export default router;
