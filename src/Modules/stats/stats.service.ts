import { REDIS_TTL, redisKeys } from "../../constants/redis";
import { postRepo } from "../../Repository/post.repository";
import type { PostRepository } from "../../Repository/post.repository";
import { delKeys, getJSON, setIfAbsentWithExpiry, setJSON } from "../../utils/cache";
import type { BlogStats } from "./stats.interface";

const STATS_WAIT_ATTEMPTS = 100;
const STATS_WAIT_MS = 50;

function wait(milliseconds: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export class StatsService {
    /** Coalesces simultaneous cold-cache requests in this API process. Redis's lock covers additional processes. */
    private statsInFlight: Promise<{ stats: BlogStats; cacheHit: boolean }> | undefined;

    public constructor(private readonly posts: PostRepository = postRepo) {}

    /** Builds the public stats response from one $facet aggregation, cached for five minutes. */
    public async getBlogStats(): Promise<{ stats: BlogStats; cacheHit: boolean }> {
        const key = redisKeys.stats();
        const cached = await getJSON<BlogStats>(key);
        if (cached) return { stats: cached, cacheHit: true };

        if (this.statsInFlight) return this.statsInFlight;

        const refresh = this.refreshStats(key);
        this.statsInFlight = refresh;
        try {
            return await refresh;
        } finally {
            if (this.statsInFlight === refresh) this.statsInFlight = undefined;
        }
    }

    private async refreshStats(key: string): Promise<{ stats: BlogStats; cacheHit: boolean }> {
        // Prevent a burst of cold-cache requests from all running the expensive aggregation.
        const hasLock = await setIfAbsentWithExpiry(redisKeys.statsLock(), "1", REDIS_TTL.STATS_LOCK_SECONDS);
        if (hasLock === false) {
            for (let attempt = 0; attempt < STATS_WAIT_ATTEMPTS; attempt += 1) {
                await wait(STATS_WAIT_MS);
                const value = await getJSON<BlogStats>(key);
                if (value) return { stats: value, cacheHit: true };
            }
        }

        try {
            const raw = await this.posts.getPublishedStats();
            const stats: BlogStats = {
                totalPublishedPosts: raw.totalPublished[0]?.count ?? 0,
                topTags: raw.topTags,
                topAuthors: raw.topAuthors.map((author) => ({
                    authorId: String(author.authorId),
                    name: author.name,
                    postCount: author.postCount,
                })),
                mostCommentedPosts: raw.mostCommented.map((post) => ({
                    id: String(post.id),
                    title: post.title,
                    commentCount: post.commentCount,
                })),
            };
            await setJSON(key, stats, REDIS_TTL.STATS_SECONDS);
            return { stats, cacheHit: false };
        } finally {
            if (hasLock) await delKeys(redisKeys.statsLock());
        }
    }
}

export const statsService = new StatsService();
