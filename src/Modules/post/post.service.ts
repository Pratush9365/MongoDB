import type { Types } from "mongoose";
import { MESSAGES } from "../../constants/constants";
import { REDIS_TTL, redisKeys } from "../../constants/redis";
import type { PostDocument } from "../../model/post.model";
import type { UserDocument } from "../../model/user.model";
import { commentRepo } from "../../Repository/comment.repository";
import type { CommentRepository } from "../../Repository/comment.repository";
import { postRepo } from "../../Repository/post.repository";
import type { PostRepository } from "../../Repository/post.repository";
import { AppError } from "../../utils/appError";
import { getJSON, getString, setJSON } from "../../utils/cache";
import { invalidatePostAndLists, invalidatePostLists } from "../../utils/cacheInvalidation";
import type {
    ICreatePostPayload,
    IListPostsQuery,
    IUpdatePostPayload,
    PublishedPostsResponse,
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
        await invalidatePostLists();
        return toPublicPost(post);
    }

    public async getPublishedById(id: Types.ObjectId): Promise<{ post: PublicPost; cacheHit: boolean }> {
        const key = redisKeys.post(id.toString());
        const cached = await getJSON<PublicPost>(key);
        if (cached) return { post: cached, cacheHit: true };

        const post = await this.posts.findPublishedById(id);
        if (!post) throw AppError.notFound(MESSAGES.POST_NOT_FOUND);
        const result = toPublicPost(post);
        await setJSON(key, result, REDIS_TTL.POST_SECONDS);
        return { post: result, cacheHit: false };
    }

    public async update(author: UserDocument, id: Types.ObjectId, payload: IUpdatePostPayload): Promise<PublicPost> {
        const existing = await this.requireOwnedPost(author, id);
        const updated = await this.posts.updateById(existing._id, payload);
        if (!updated) throw AppError.notFound(MESSAGES.POST_NOT_FOUND);
        await invalidatePostAndLists(updated._id.toString());
        return toPublicPost(updated);
    }

    public async remove(author: UserDocument, id: Types.ObjectId): Promise<void> {
        const existing = await this.requireOwnedPost(author, id);
        await this.comments.deleteAllForPost(existing._id);
        await this.posts.deleteById(existing._id);
        await invalidatePostAndLists(existing._id.toString());
    }

    public async listMine(author: UserDocument): Promise<PublicPost[]> {
        const posts = await this.posts.findByAuthor(author._id);
        return posts.map((post) => toPublicPost(post));
    }

    public async listPublished(query: IListPostsQuery): Promise<{ response: PublishedPostsResponse; cacheHit: boolean }> {
        // Canonicalize before both querying and key-building so default/case variants share one cache entry.
        const normalizedQuery: IListPostsQuery = {
            ...query,
            search: query.search?.toLowerCase(),
            tag: query.tag?.toLowerCase(),
        };
        const versionRaw = await getString(redisKeys.postsListVersion());
        const version = versionRaw !== null && /^\d+$/.test(versionRaw) ? versionRaw : "0";
        const key = redisKeys.postsList(
            version,
            normalizedQuery.page,
            normalizedQuery.limit,
            normalizedQuery.search ?? "",
            normalizedQuery.tag ?? "",
            normalizedQuery.sort,
        );
        const cached = await getJSON<PublishedPostsResponse>(key);
        if (cached) return { response: cached, cacheHit: true };

        const { items, total } = await this.posts.listPublished(normalizedQuery);
        const response: PublishedPostsResponse = {
            success: true,
            data: items.map((post) => toPublicPost(post, false)),
            pagination: {
                page: normalizedQuery.page,
                limit: normalizedQuery.limit,
                total,
                totalPages: total === 0 ? 0 : Math.ceil(total / normalizedQuery.limit),
            },
        };
        await setJSON(key, response, REDIS_TTL.POST_LIST_SECONDS);
        return { response, cacheHit: false };
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
