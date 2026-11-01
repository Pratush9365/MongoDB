import { Types } from "mongoose";
import { AUTH, COMMENT, MESSAGES, POST } from "../constants/constants";
import type { PostListSort, PostStatus } from "../constants/constants";
import { AppError } from "./appError";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const TAG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

/** Express 5 leaves req.body undefined when no body was sent. Always work with a plain object. */
export function asBody(body: unknown): Record<string, unknown> {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        throw AppError.badRequest("Request body must be a JSON object");
    }
    return body as Record<string, unknown>;
}

export function readName(value: unknown): string {
    if (typeof value !== "string") throw AppError.badRequest("name is required");
    const name = value.trim();
    if (name.length < AUTH.NAME_MIN_LENGTH) {
        throw AppError.badRequest(`name must be at least ${AUTH.NAME_MIN_LENGTH} characters`);
    }
    if (name.length > AUTH.NAME_MAX_LENGTH) {
        throw AppError.badRequest(`name must be at most ${AUTH.NAME_MAX_LENGTH} characters`);
    }
    return name;
}

/** Returns the email trimmed and lowercased, the same way it is stored. */
export function readEmail(value: unknown): string {
    if (typeof value !== "string") throw AppError.badRequest("email is required");
    const email = value.trim().toLowerCase();
    if (email.length === 0) throw AppError.badRequest("email is required");
    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
        throw AppError.badRequest("email must be a valid email address");
    }
    return email;
}

/** Rules for choosing a NEW password (signup). */
export function readNewPassword(value: unknown): string {
    if (typeof value !== "string" || value.length === 0) throw AppError.badRequest("password is required");
    if (value.length < AUTH.PASSWORD_MIN_LENGTH) {
        throw AppError.badRequest(`password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters`);
    }
    if (Buffer.byteLength(value, "utf8") > AUTH.PASSWORD_MAX_BYTES) {
        throw AppError.badRequest(`password must be at most ${AUTH.PASSWORD_MAX_BYTES} bytes`);
    }
    return value;
}

const OBJECT_ID_PATTERN = /^[a-fA-F0-9]{24}$/;

/** Rejects malformed MongoDB ObjectIds with 400 before they reach a findById. */
export function readObjectId(value: unknown): Types.ObjectId {
    if (typeof value !== "string" || !OBJECT_ID_PATTERN.test(value) || !Types.ObjectId.isValid(value)) {
        throw AppError.badRequest(MESSAGES.INVALID_OBJECT_ID);
    }
    return new Types.ObjectId(value);
}

export function readPostTitle(value: unknown): string {
    if (typeof value !== "string") throw AppError.badRequest("title is required");
    const title = value.trim();
    if (title.length < POST.TITLE_MIN_LENGTH) {
        throw AppError.badRequest(`title must be at least ${POST.TITLE_MIN_LENGTH} characters`);
    }
    if (title.length > POST.TITLE_MAX_LENGTH) {
        throw AppError.badRequest(`title must be at most ${POST.TITLE_MAX_LENGTH} characters`);
    }
    return title;
}

export function readPostBody(value: unknown): string {
    if (typeof value !== "string") throw AppError.badRequest("body is required");
    const body = value.trim();
    if (body.length < POST.BODY_MIN_LENGTH) {
        throw AppError.badRequest(`body must be at least ${POST.BODY_MIN_LENGTH} characters`);
    }
    return body;
}

export function readTags(value: unknown): string[] {
    if (value === undefined) return [];
    if (!Array.isArray(value)) throw AppError.badRequest("tags must be an array of strings");
    if (value.length > POST.MAX_TAGS) throw AppError.badRequest(`tags allows at most ${POST.MAX_TAGS} items`);

    const tags: string[] = [];
    const seen = new Set<string>();
    for (const item of value) {
        if (typeof item !== "string") throw AppError.badRequest("each tag must be a string");
        const tag = item.trim().toLowerCase();
        if (tag.length === 0) throw AppError.badRequest("tags cannot contain empty values");
        if (tag.length > POST.TAG_MAX_LENGTH) {
            throw AppError.badRequest(`each tag must be at most ${POST.TAG_MAX_LENGTH} characters`);
        }
        if (!TAG_PATTERN.test(tag)) {
            throw AppError.badRequest("tags may only contain lowercase letters, numbers and hyphens");
        }
        if (seen.has(tag)) continue;
        seen.add(tag);
        tags.push(tag);
    }
    return tags;
}

export function readPostStatus(value: unknown, fallback: PostStatus = "draft"): PostStatus {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !(POST.STATUSES as readonly string[]).includes(value)) {
        throw AppError.badRequest(`status must be one of: ${POST.STATUSES.join(", ")}`);
    }
    return value as PostStatus;
}

export function readCommentText(value: unknown): string {
    if (typeof value !== "string") throw AppError.badRequest("text is required");
    const text = value.trim();
    if (text.length < COMMENT.TEXT_MIN_LENGTH) throw AppError.badRequest("text is required");
    if (text.length > COMMENT.TEXT_MAX_LENGTH) {
        throw AppError.badRequest(`text must be at most ${COMMENT.TEXT_MAX_LENGTH} characters`);
    }
    return text;
}

export interface PaginationInput {
    page: number;
    limit: number;
}

export function readPagination(
    query: Record<string, unknown>,
    defaults: { page: number; limit: number; maxLimit: number },
): PaginationInput {
    const page = readPositiveInt(query.page, "page", defaults.page);
    const limit = readPositiveInt(query.limit, "limit", defaults.limit);
    if (limit > defaults.maxLimit) {
        throw AppError.badRequest(`limit must be at most ${defaults.maxLimit}`);
    }
    return { page, limit };
}

function readPositiveInt(value: unknown, field: string, fallback: number): number {
    if (value === undefined) return fallback;
    const raw = Array.isArray(value) ? value[0] : value;
    const n = typeof raw === "string" ? Number(raw) : typeof raw === "number" ? raw : NaN;
    if (!Number.isInteger(n) || n < 1) throw AppError.badRequest(`${field} must be a positive integer`);
    return n;
}

export function readOptionalString(value: unknown): string | undefined {
    if (value === undefined) return undefined;
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string") throw AppError.badRequest("Expected a string query parameter");
    const trimmed = raw.trim();
    return trimmed.length === 0 ? undefined : trimmed;
}

export function readPostListSort(value: unknown): PostListSort {
    if (value === undefined) return "newest";
    const raw = Array.isArray(value) ? value[0] : value;
    if (typeof raw !== "string" || !(POST.LIST_SORTS as readonly string[]).includes(raw)) {
        throw AppError.badRequest(`sort must be one of: ${POST.LIST_SORTS.join(", ")}`);
    }
    return raw as PostListSort;
}
