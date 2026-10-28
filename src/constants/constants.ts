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
    INTERNAL_SERVER_ERROR: "Something went wrong.",
    INVALID_JSON: "Request body is not valid JSON",
    ROUTE_NOT_FOUND: "Route not found",
} as const;
