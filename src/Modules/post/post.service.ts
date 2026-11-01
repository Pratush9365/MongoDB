import type { Types } from "mongoose";
import { MESSAGES } from "../../constants/constants";
import type { PostDocument } from "../../model/post.model";
import type { UserDocument } from "../../model/user.model";
import { commentRepo } from "../../Repository/comment.repository";
import type { CommentRepository } from "../../Repository/comment.repository";
import { postRepo } from "../../Repository/post.repository";
import type { PostRepository } from "../../Repository/post.repository";
import { AppError } from "../../utils/appError";
import type {
    ICreatePostPayload,
    IListPostsQuery,
    IUpdatePostPayload,
    PaginatedPostsResult,
    PublicPost,
} from "./post.interface";

/** Builds the API shape for a post. List responses omit `body` via projection. */
export function toPublicPost(post: PostDocument | Record<string, unknown>, includeBody = true): PublicPost {
    const doc = post as {
        _id: Types.ObjectId | string;
        title: string;
        body?: string;
        tags: string[];
        author: Types.ObjectId | string;
        authorName: string;
        status: PublicPost["status"];
        commentCount: number;
        createdAt: Date;
        updatedAt: Date;
    };

    const result: PublicPost = {
        id: String(doc._id),
        title: doc.title,
        tags: doc.tags ?? [],
        author: String(doc.author),
        authorName: doc.authorName,
        status: doc.status,
        commentCount: doc.commentCount ?? 0,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
    };
    if (includeBody && doc.body !== undefined) result.body = doc.body;
    return result;
}

export class PostService {
    public constructor(
        private readonly posts: PostRepository = postRepo,
        private readonly comments: CommentRepository = commentRepo,
    ) {}

    public async create(author: UserDocument, payload: ICreatePostPayload): Promise<PublicPost> {
        const post = await this.posts.create({
            title: payload.title,
            body: payload.body,
            tags: payload.tags,
            author: author._id,
            authorName: author.name,
            status: payload.status,
        });
        return toPublicPost(post);
    }

    public async getPublishedById(id: Types.ObjectId): Promise<PublicPost> {
        const post = await this.posts.findPublishedById(id);
        if (!post) throw AppError.notFound(MESSAGES.POST_NOT_FOUND);
        return toPublicPost(post);
    }

    public async update(author: UserDocument, id: Types.ObjectId, payload: IUpdatePostPayload): Promise<PublicPost> {
        const existing = await this.requireOwnedPost(author, id);
        const updated = await this.posts.updateById(existing._id, payload);
        if (!updated) throw AppError.notFound(MESSAGES.POST_NOT_FOUND);
        return toPublicPost(updated);
    }

    public async remove(author: UserDocument, id: Types.ObjectId): Promise<void> {
        const existing = await this.requireOwnedPost(author, id);
        await this.comments.deleteAllForPost(existing._id);
        await this.posts.deleteById(existing._id);
    }

    public async listMine(author: UserDocument): Promise<PublicPost[]> {
        const posts = await this.posts.findByAuthor(author._id);
        return posts.map((post) => toPublicPost(post));
    }

    public async listPublished(query: IListPostsQuery): Promise<PaginatedPostsResult> {
        const { items, total } = await this.posts.listPublished(query);
        return {
            data: items.map((post) => toPublicPost(post, false)),
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                totalPages: total === 0 ? 0 : Math.ceil(total / query.limit),
            },
        };
    }

    private async requireOwnedPost(author: UserDocument, id: Types.ObjectId): Promise<PostDocument> {
        const post = await this.posts.findById(id);
        if (!post) throw AppError.notFound(MESSAGES.POST_NOT_FOUND);
        if (post.author.toString() !== author._id.toString()) {
            throw AppError.forbidden(MESSAGES.NOT_POST_AUTHOR);
        }
        return post;
    }
}

export const postService = new PostService();
