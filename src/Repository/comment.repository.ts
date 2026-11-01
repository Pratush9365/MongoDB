import { Types } from "mongoose";
import { Comment } from "../model/comment.model";
import type { CommentDocument } from "../model/comment.model";

export interface NewComment {
    postId: Types.ObjectId;
    userId: Types.ObjectId;
    userName: string;
    text: string;
}

export interface PaginatedComments {
    items: CommentDocument[];
    total: number;
}

export interface CursorComments {
    items: CommentDocument[];
    hasMore: boolean;
}

function asObjectId(id: Types.ObjectId | string): Types.ObjectId {
    return typeof id === "string" ? new Types.ObjectId(id) : id;
}

/** Database layer for comments: the only place that talks to the Comment model. */
export class CommentRepository {
    public create(comment: NewComment): Promise<CommentDocument> {
        return Comment.create(comment);
    }

    public findById(id: Types.ObjectId | string): Promise<CommentDocument | null> {
        return Comment.findById(id).exec();
    }

    public async deleteById(id: Types.ObjectId | string): Promise<CommentDocument | null> {
        return Comment.findByIdAndDelete(id).exec();
    }

    public async deleteAllForPost(postId: Types.ObjectId | string): Promise<number> {
        const result = await Comment.deleteMany({ postId }).exec();
        return result.deletedCount;
    }

    public async listForPost(
        postId: Types.ObjectId | string,
        page: number,
        limit: number,
    ): Promise<PaginatedComments> {
        const skip = (page - 1) * limit;

        const [facet] = await Comment.aggregate<{
            items: CommentDocument[];
            total: Array<{ count: number }>;
        }>([
            { $match: { postId: asObjectId(postId) } },
            {
                $facet: {
                    items: [{ $sort: { createdAt: -1, _id: -1 } }, { $skip: skip }, { $limit: limit }],
                    total: [{ $count: "count" }],
                },
            },
        ]).exec();

        return {
            items: (facet?.items ?? []) as CommentDocument[],
            total: facet?.total[0]?.count ?? 0,
        };
    }

    /**
     * Part 7 bonus: comments older than the `after` cursor (newest-first feed).
     * Fetches limit+1 so the caller can set hasMore / nextCursor.
     */
    public async listForPostAfter(
        postId: Types.ObjectId | string,
        after: CommentDocument,
        limit: number,
    ): Promise<CursorComments> {
        const items = await Comment.find({
            postId: asObjectId(postId),
            $or: [
                { createdAt: { $lt: after.createdAt } },
                { createdAt: after.createdAt, _id: { $lt: after._id } },
            ],
        })
            .sort({ createdAt: -1, _id: -1 })
            .limit(limit + 1)
            .exec();

        const hasMore = items.length > limit;
        return { items: hasMore ? items.slice(0, limit) : items, hasMore };
    }
}

export const commentRepo = new CommentRepository();
