import type { PostListSort, PostStatus } from "../../constants/constants";

export interface PublicPost {
    id: string;
    title: string;
    body?: string;
    tags: string[];
    author: string;
    authorName: string;
    status: PostStatus;
    commentCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ICreatePostPayload {
    title: string;
    body: string;
    tags: string[];
    status: PostStatus;
}

export interface IUpdatePostPayload {
    title?: string;
    body?: string;
    tags?: string[];
    status?: PostStatus;
}

export interface IListPostsQuery {
    page: number;
    limit: number;
    search?: string;
    tag?: string;
    sort: PostListSort;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface PaginatedPostsResult {
    data: PublicPost[];
    pagination: PaginationMeta;
}

/** Exact body returned by the public posts endpoint and stored in its Redis cache. */
export interface PublishedPostsResponse extends PaginatedPostsResult {
    success: true;
}
