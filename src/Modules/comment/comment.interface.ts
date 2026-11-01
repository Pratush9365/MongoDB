import type { PaginationMeta } from "../post/post.interface";

export interface PublicComment {
    id: string;
    postId: string;
    userId: string;
    userName: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreateCommentPayload {
    text: string;
}

export interface PaginatedCommentsResult {
    data: PublicComment[];
    pagination: PaginationMeta;
}

/** Part 7 bonus: cursor pagination when `after` is provided. */
export interface CursorCommentsResult {
    data: PublicComment[];
    pagination: {
        limit: number;
        nextCursor: string | null;
        hasMore: boolean;
    };
}
