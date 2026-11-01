import type { Request, Response } from "express";
import { COMMENT, HTTP_STATUS } from "../../constants/constants";
import { getAuth } from "../../middlewares/auth.middleware";
import {
    asBody,
    readCommentText,
    readObjectId,
    readOptionalString,
    readPagination,
} from "../../utils/validation";
import { CommentService, commentService } from "./comment.service";

export class CommentController {
    public constructor(private readonly service: CommentService = commentService) {}

    /** POST /api/posts/:id/comments — login required; published posts only */
    public create = async (req: Request, res: Response): Promise<void> => {
        const { user } = getAuth(req);
        const postId = readObjectId(req.params.id);
        const body = asBody(req.body);
        const comment = await this.service.create(user, postId, { text: readCommentText(body.text) });
        res.status(HTTP_STATUS.CREATED).json({ success: true, data: comment });
    };

    /**
     * GET /api/posts/:id/comments — public; newest first.
     * Page mode: ?page=&limit=
     * Cursor mode (Part 7 bonus): ?after=<lastCommentId>&limit=
     */
    public listForPost = async (req: Request, res: Response): Promise<void> => {
        const postId = readObjectId(req.params.id);
        const query = req.query as Record<string, unknown>;
        const afterRaw = readOptionalString(query.after);

        if (afterRaw !== undefined) {
            const afterId = readObjectId(afterRaw);
            const { limit } = readPagination(
                { limit: query.limit },
                {
                    page: COMMENT.DEFAULT_PAGE,
                    limit: COMMENT.DEFAULT_LIMIT,
                    maxLimit: COMMENT.MAX_LIMIT,
                },
            );
            const result = await this.service.listForPostAfter(postId, afterId, limit);
            res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: result.pagination });
            return;
        }

        const { page, limit } = readPagination(query, {
            page: COMMENT.DEFAULT_PAGE,
            limit: COMMENT.DEFAULT_LIMIT,
            maxLimit: COMMENT.MAX_LIMIT,
        });
        const result = await this.service.listForPost(postId, page, limit);
        res.status(HTTP_STATUS.OK).json({ success: true, data: result.data, pagination: result.pagination });
    };

    /** DELETE /api/comments/:id — comment author or post author */
    public remove = async (req: Request, res: Response): Promise<void> => {
        const { user } = getAuth(req);
        const commentId = readObjectId(req.params.id);
        await this.service.remove(user, commentId);
        res.status(HTTP_STATUS.OK).json({ success: true, message: "Comment deleted" });
    };
}
