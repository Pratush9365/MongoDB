import type { Request, Response } from "express";
import { HTTP_STATUS, POST } from "../../constants/constants";
import { getAuth } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/appError";
import {
    asBody,
    readObjectId,
    readOptionalString,
    readPagination,
    readPostBody,
    readPostListSort,
    readPostStatus,
    readPostTitle,
    readTags,
} from "../../utils/validation";
import type { ICreatePostPayload, IUpdatePostPayload } from "./post.interface";
import { PostService, postService } from "./post.service";

export class PostController {
    public constructor(private readonly service: PostService = postService) {}

    /** POST /api/posts */
    public create = async (req: Request, res: Response): Promise<void> => {
        const { user } = getAuth(req);
        const body = asBody(req.body);
        const payload: ICreatePostPayload = {
            title: readPostTitle(body.title),
            body: readPostBody(body.body),
            tags: readTags(body.tags),
            status: readPostStatus(body.status, "draft"),
        };
        const post = await this.service.create(user, payload);
        res.status(HTTP_STATUS.CREATED).json({ success: true, data: post });
    };

    /** GET /api/posts/:id — public published post */
    public getById = async (req: Request, res: Response): Promise<void> => {
        const id = readObjectId(req.params.id);
        const { post, cacheHit } = await this.service.getPublishedById(id);
        res.set("X-Cache", cacheHit ? "HIT" : "MISS");
        res.status(HTTP_STATUS.OK).json({ success: true, data: post });
    };

    /** PATCH /api/posts/:id — author only */
    public update = async (req: Request, res: Response): Promise<void> => {
        const { user } = getAuth(req);
        const id = readObjectId(req.params.id);
        const body = asBody(req.body);

        const payload: IUpdatePostPayload = {};
        if (body.title !== undefined) payload.title = readPostTitle(body.title);
        if (body.body !== undefined) payload.body = readPostBody(body.body);
        if (body.tags !== undefined) payload.tags = readTags(body.tags);
        if (body.status !== undefined) payload.status = readPostStatus(body.status);

        if (Object.keys(payload).length === 0) {
            throw AppError.badRequest("Provide at least one of: title, body, tags, status");
        }

        const post = await this.service.update(user, id, payload);
        res.status(HTTP_STATUS.OK).json({ success: true, data: post });
    };

    /** DELETE /api/posts/:id — author only; also deletes comments */
    public remove = async (req: Request, res: Response): Promise<void> => {
        const { user } = getAuth(req);
        const id = readObjectId(req.params.id);
        await this.service.remove(user, id);
        res.status(HTTP_STATUS.OK).json({ success: true, message: "Post deleted" });
    };

    /** GET /api/users/me/posts — includes drafts */
    public listMine = async (req: Request, res: Response): Promise<void> => {
        const { user } = getAuth(req);
        const posts = await this.service.listMine(user);
        res.status(HTTP_STATUS.OK).json({ success: true, data: posts });
    };

    /** GET /api/posts — public published list with $facet pagination */
    public listPublished = async (req: Request, res: Response): Promise<void> => {
        const query = req.query as Record<string, unknown>;
        const { page, limit } = readPagination(query, {
            page: POST.DEFAULT_PAGE,
            limit: POST.DEFAULT_LIMIT,
            maxLimit: POST.MAX_LIMIT,
        });
        const { response, cacheHit } = await this.service.listPublished({
            page,
            limit,
            search: readOptionalString(query.search),
            tag: readOptionalString(query.tag)?.toLowerCase(),
            sort: readPostListSort(query.sort),
        });
        res.set("X-Cache", cacheHit ? "HIT" : "MISS");
        res.status(HTTP_STATUS.OK).json(response);
    };
}
