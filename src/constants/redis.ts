import { getConfig } from "./config";

/** Every Redis expiry is expressed in seconds because that is Redis's native TTL unit. */
export const REDIS_TTL = {
    PROFILE_SECONDS: 60 * 60,
    POST_SECONDS: 10 * 60,
    POST_LIST_SECONDS: 60,
    STATS_SECONDS: 5 * 60,
    STATS_LOCK_SECONDS: 30,
    LOGIN_FAILURE_SECONDS: 15 * 60,
} as const;

function prefix(): string {
    return getConfig().redisKeyPrefix;
}

/** Keeps dynamic query values from changing the Redis-key structure. */
function encodePart(value: string): string {
    return encodeURIComponent(value);
}

/**
 * The only place Redis key names are assembled. The prefix intentionally matches
 * the MongoDB database name, as required by the assignment.
 */
export const redisKeys = {
    session: (token: string): string => `${prefix()}:session:${token}`,
    user: (userId: string): string => `${prefix()}:user:${userId}`,
    userSessions: (userId: string): string => `${prefix()}:user:${userId}:sessions`,
    loginFailures: (email: string): string => `${prefix()}:login:fail:${encodePart(email)}`,
    post: (postId: string): string => `${prefix()}:post:${postId}`,
    postsListVersion: (): string => `${prefix()}:posts:list:version`,
    postsList: (version: string, page: number, limit: number, search: string, tag: string, sort: string): string =>
        `${prefix()}:posts:list:v${version}:p${page}:l${limit}:s${encodePart(search)}:t${encodePart(tag)}:o${sort}`,
    stats: (): string => `${prefix()}:stats`,
    statsLock: (): string => `${prefix()}:stats:lock`,
} as const;
