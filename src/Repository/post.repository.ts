import type { Types } from "mongoose";
import type { PostListSort, PostStatus } from "../constants/constants";
import { Post } from "../model/post.model";
import type { PostDocument } from "../model/post.model";

export interface NewPost {
    title: string;
    body: string;
    tags: string[];
    author: Types.ObjectId;
    authorName: string;
    status: PostStatus;
}

export interface UpdatePostFields {
    title?: string;
    body?: string;
    tags?: string[];
    status?: PostStatus;
}

export interface ListPublishedPostsQuery {
    page: number;
    limit: number;
    search?: string;
    tag?: string;
    sort: PostListSort;
}

export interface PaginatedPosts {
    items: PostDocument[];
    total: number;
}

/** Fields returned for a public list (body is intentionally omitted). */
const LIST_PROJECTION = {
    title: 1,
    tags: 1,
    author: 1,
    authorName: 1,
    status: 1,
    commentCount: 1,
    createdAt: 1,
    updatedAt: 1,
} as const;

/** Database layer for posts: the only place that talks to the Post model. */
export class PostRepository {
    public create(post: NewPost): Promise<PostDocument> {
        return Post.create(post);
    }

    public findById(id: Types.ObjectId | string): Promise<PostDocument | null> {
        return Post.findById(id).exec();
    }

    public findPublishedById(id: Types.ObjectId | string): Promise<PostDocument | null> {
        return Post.findOne({ _id: id, status: "published" }).exec();
    }

    public updateById(id: Types.ObjectId | string, fields: UpdatePostFields): Promise<PostDocument | null> {
        return Post.findByIdAndUpdate(id, fields, { returnDocument: "after", runValidators: true }).exec();
    }

    public async deleteById(id: Types.ObjectId | string): Promise<PostDocument | null> {
        return Post.findByIdAndDelete(id).exec();
    }

    public findByAuthor(authorId: Types.ObjectId | string): Promise<PostDocument[]> {
        return Post.find({ author: authorId }).sort({ createdAt: -1 }).exec();
    }

    public async listPublished(query: ListPublishedPostsQuery): Promise<PaginatedPosts> {
        const filter: Record<string, unknown> = { status: "published" };
        if (query.search) filter.title = { $regex: escapeRegex(query.search), $options: "i" };
        if (query.tag) filter.tags = query.tag.toLowerCase();

        const sort = sortSpec(query.sort);
        const skip = (query.page - 1) * query.limit;

        const [facet] = await Post.aggregate<{ items: PostDocument[]; total: Array<{ count: number }> }>([
            { $match: filter },
            {
                $facet: {
                    items: [{ $sort: sort }, { $skip: skip }, { $limit: query.limit }, { $project: LIST_PROJECTION }],
                    total: [{ $count: "count" }],
                },
            },
        ]).exec();

        return {
            items: (facet?.items ?? []) as PostDocument[],
            total: facet?.total[0]?.count ?? 0,
        };
    }

    public async incrementCommentCount(id: Types.ObjectId | string, by: number): Promise<PostDocument | null> {
        return Post.findByIdAndUpdate(
            id,
            { $inc: { commentCount: by } },
            { returnDocument: "after" },
        ).exec();
    }

    /**
     * Part 5: one aggregation with $facet for all public stats on published posts.
     * topAuthors uses $lookup on users (as required by the assignment).
     */
    public async getPublishedStats(): Promise<PublishedStatsRaw> {
        const [result] = await Post.aggregate<PublishedStatsRaw>([
            { $match: { status: "published" } },
            {
                $facet: {
                    totalPublished: [{ $count: "count" }],
                    topTags: [
                        { $unwind: "$tags" },
                        { $group: { _id: "$tags", count: { $sum: 1 } } },
                        { $sort: { count: -1, _id: 1 } },
                        { $limit: 10 },
                        { $project: { _id: 0, tag: "$_id", count: 1 } },
                    ],
                    topAuthors: [
                        { $group: { _id: "$author", postCount: { $sum: 1 } } },
                        { $sort: { postCount: -1, _id: 1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: "users",
                                localField: "_id",
                                foreignField: "_id",
                                as: "user",
                            },
                        },
                        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                _id: 0,
                                authorId: "$_id",
                                name: { $ifNull: ["$user.name", "Unknown"] },
                                postCount: 1,
                            },
                        },
                    ],
                    mostCommented: [
                        { $sort: { commentCount: -1, createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $project: {
                                _id: 0,
                                id: "$_id",
                                title: 1,
                                commentCount: 1,
                            },
                        },
                    ],
                },
            },
        ]).exec();

        return (
            result ?? {
                totalPublished: [],
                topTags: [],
                topAuthors: [],
                mostCommented: [],
            }
        );
    }
}

export interface PublishedStatsRaw {
    totalPublished: Array<{ count: number }>;
    topTags: Array<{ tag: string; count: number }>;
    topAuthors: Array<{ authorId: Types.ObjectId; name: string; postCount: number }>;
    mostCommented: Array<{ id: Types.ObjectId; title: string; commentCount: number }>;
}

function sortSpec(sort: PostListSort): Record<string, 1 | -1> {
    switch (sort) {
        case "oldest":
            return { createdAt: 1 };
        case "mostCommented":
            return { commentCount: -1, createdAt: -1 };
        case "newest":
        default:
            return { createdAt: -1 };
    }
}

function escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const postRepo = new PostRepository();
