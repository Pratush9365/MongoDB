/** Global constants shared across the app. */
export const API_PREFIX = "/api";

export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
} as const;

export const MESSAGES = {
    INTERNAL_SERVER_ERROR: "Something went wrong. Please try again later.",
    INVALID_JSON: "Request body is not valid JSON",
    ROUTE_NOT_FOUND: "Route not found",
    EMAIL_TAKEN: "An account with this email already exists",
    INVALID_CREDENTIALS: "Invalid email or password",
    AUTH_REQUIRED: "Authentication required. Send 'Authorization: Bearer <token>'",
    SESSION_INVALID: "Invalid or expired session. Please log in again",
    LOGGED_OUT: "Logged out successfully",
    LOGGED_OUT_ALL: "Logged out from all devices",
    POST_NOT_FOUND: "Post not found",
    COMMENT_NOT_FOUND: "Comment not found",
    NOT_POST_AUTHOR: "Only the author can modify this post",
    NOT_COMMENT_OWNER: "Only the comment author or the post author can delete this comment",
    COMMENTS_ONLY_PUBLISHED: "Comments are only allowed on published posts",
    INVALID_OBJECT_ID: "Invalid id format",
    LOGIN_RATE_LIMITED: "Too many failed login attempts. Try again later.",
    DUPLICATE_RECORD_MESSAGE : "A record with this value already exists",
    REQUEST_COULD_NOT_BE_PROCESSED : "Request could not be processed"

} as const;

export const AUTH = {
    /** A session is valid for 7 days after login. */
    SESSION_TTL_DAYS: 7,
    SESSION_TTL_MS: 7 * 24 * 60 * 60 * 1000,
    /** Number of random bytes behind a session token (hex-encoded -> 64 characters). */
    TOKEN_BYTES: 32,
    BCRYPT_ROUNDS: 10,
    PASSWORD_MIN_LENGTH: 8,
    /** bcrypt silently ignores everything after 72 bytes, so longer passwords are rejected. */
    PASSWORD_MAX_BYTES: 72,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 50,
    /** Part 7 bonus: lock after this many failed logins inside the window. */
    LOGIN_MAX_ATTEMPTS: 5,
    /** Part 7 bonus: failed-login window / lock duration (15 minutes). */
    LOGIN_WINDOW_MS: 15 * 60 * 1000,
    LOGIN_WINDOW_SECONDS: 15 * 60,
} as const;

export const POST = {
    TITLE_MIN_LENGTH: 5,
    TITLE_MAX_LENGTH: 120,
    BODY_MIN_LENGTH: 20,
    MAX_TAGS: 5,
    TAG_MAX_LENGTH: 30,
    STATUSES: ["draft", "published"] as const,
    LIST_SORTS: ["newest", "oldest", "mostCommented"] as const,
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
} as const;

export type PostStatus = (typeof POST.STATUSES)[number];
export type PostListSort = (typeof POST.LIST_SORTS)[number];

export const COMMENT = {
    TEXT_MIN_LENGTH: 1,
    TEXT_MAX_LENGTH: 500,
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 50,
} as const;
