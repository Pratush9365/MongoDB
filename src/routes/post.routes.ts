import { Router } from "express";
import { requireAuth } from "../middlewares/auth.middleware";
import { asyncHandler } from "../middlewares/validation.middleware";
import { CommentController } from "../Modules/comment/comment.controller";
import { PostController } from "../Modules/post/post.controller";

const router = Router();
const posts = new PostController();
const comments = new CommentController();

router.get("/posts", asyncHandler(posts.listPublished));
router.post("/posts", requireAuth, asyncHandler(posts.create));
router.get("/posts/:id", asyncHandler(posts.getById));
router.patch("/posts/:id", requireAuth, asyncHandler(posts.update));
router.delete("/posts/:id", requireAuth, asyncHandler(posts.remove));

router.get("/posts/:id/comments", asyncHandler(comments.listForPost));
router.post("/posts/:id/comments", requireAuth, asyncHandler(comments.create));

export default router;
