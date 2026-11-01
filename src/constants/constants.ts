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
} as const;
