import type { Types } from "mongoose";
import { MESSAGES } from "../../constants/constants";
import type { CommentDocument } from "../../model/comment.model";
import type { UserDocument } from "../../model/user.model";
import { commentRepo } from "../../Repository/comment.repository";
import type { CommentRepository } from "../../Repository/comment.repository";
import { postRepo } from "../../Repository/post.repository";
import type { PostRepository } from "../../Repository/post.repository";
import { AppError } from "../../utils/appError";
import { invalidatePostAndLists } from "../../utils/cacheInvalidation";
import type {
    CursorCommentsResult,
    ICreateCommentPayload,
    PaginatedCommentsResult,
    PublicComment,
} from "./comment.interface";

export function toPublicComment(comment: CommentDocument | Record<string, unknown>): PublicComment {
    const doc = comment as {
        _id: Types.ObjectId | string;
        postId: Types.ObjectId | string;
        userId: Types.ObjectId | string;
        userName: string;
        text: string;
        createdAt: Date;
        updatedAt: Date;
    };

    return {
        id: String(doc._id),
        postId: String(doc.postId),
        userId: String(doc.userId),
        userName: doc.userName,
        text: doc.text,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
}

export class CommentService {
    public constructor(
        private readonly comments: CommentRepository = commentRepo,
        private readonly posts: PostRepository = postRepo,
    ) {}

    public async create(
        user: UserDocument,
        postId: Types.ObjectId,
        payload: ICreateCommentPayload,
    ): Promise<PublicComment> {
        const post = await this.posts.findById(postId);
        if (!post) throw AppError.notFound(MESSAGES.POST_NOT_FOUND);
        if (post.status !== "published") throw AppError.badRequest(MESSAGES.COMMENTS_ONLY_PUBLISHED);

        const comment = await this.comments.create({
            postId: post._id,
            userId: user._id,
            userName: user.name,
            text: payload.text,
        });
        await this.posts.incrementCommentCount(post._id, 1);
        // The post response and every public-list version include commentCount.
        await invalidatePostAndLists(post._id.toString());
        return toPublicComment(comment);
    }

    public async listForPost(
        postId: Types.ObjectId,
        page: number,
        limit: number,
    ): Promise<PaginatedCommentsResult> {
        const post = await this.posts.findById(postId);
        if (!post) throw AppError.notFound(MESSAGES.POST_NOT_FOUND);

        const { items, total } = await this.comments.listForPost(postId, page, limit);
        return {
            data: items.map((comment) => toPublicComment(comment)),
            pagination: {
                page,
                limit,
                total,
                totalPages: total === 0 ? 0 : Math.ceil(total / limit),
            },
        };
    }

    /** Part 7 bonus: `GET .../comments?after=<lastCommentId>` */
    public async listForPostAfter(
        postId: Types.ObjectId,
        afterId: Types.ObjectId,
        limit: number,
    ): Promise<CursorCommentsResult> {
        const post = await this.posts.findById(postId);
        if (!post) throw AppError.notFound(MESSAGES.POST_NOT_FOUND);

        const cursor = await this.comments.findById(afterId);
        if (!cursor || cursor.postId.toString() !== postId.toString()) {
            throw AppError.badRequest("after must be a comment id from this post");
        }

        const { items, hasMore } = await this.comments.listForPostAfter(postId, cursor, limit);
        const data = items.map((comment) => toPublicComment(comment));
        const last = data[data.length - 1];

        return {
            data,
            pagination: {
                limit,
                nextCursor: hasMore && last ? last.id : null,
                hasMore,
            },
        };
    }

    public async remove(user: UserDocument, commentId: Types.ObjectId): Promise<void> {
        const comment = await this.comments.findById(commentId);
        if (!comment) throw AppError.notFound(MESSAGES.COMMENT_NOT_FOUND);

        const post = await this.posts.findById(comment.postId);
        const isCommentAuthor = comment.userId.toString() === user._id.toString();
        const isPostAuthor = post !== null && post.author.toString() === user._id.toString();
        if (!isCommentAuthor && !isPostAuthor) {
            throw AppError.forbidden(MESSAGES.NOT_COMMENT_OWNER);
        }

        await this.comments.deleteById(comment._id);
        if (post) await this.posts.incrementCommentCount(post._id, -1);
        await invalidatePostAndLists(comment.postId.toString());
    }
}

export const commentService = new CommentService();
