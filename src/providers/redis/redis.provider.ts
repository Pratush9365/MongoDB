import Redis from "ioredis";
import { getConfig } from "../../constants/config";

/** Owns the one shared ioredis connection used by the whole API. */
export class RedisProvider {
    private static client: Redis | undefined;

    public static getClient(): Redis {
        if (RedisProvider.client) return RedisProvider.client;

        const client = new Redis(getConfig().redisUrl, {
            lazyConnect: true,
            enableOfflineQueue: false,
            maxRetriesPerRequest: 1,
            connectTimeout: 10_000,
            retryStrategy: (attempt: number) => Math.min(attempt * 200, 2_000),
        });
        // ioredis emits `error`; a listener is essential so a later Redis outage never crashes Node.
        client.on("error", (error: Error) => console.error("Redis error:", error.message));
        client.on("reconnecting", () => console.warn("Redis reconnecting..."));

        RedisProvider.client = client;
        return client;
    }

    /** Startup is intentionally strict: do not accept API traffic until Redis and MongoDB are reachable. */
    public static async initConn(): Promise<void> {
        const client = RedisProvider.getClient();
        if (client.status === "wait") await client.connect();
        await client.ping();
        console.log("Redis connected");
    }

    public static async closeConn(): Promise<void> {
        const client = RedisProvider.client;
        RedisProvider.client = undefined;
        if (!client) return;

        try {
            await client.quit();
        } catch (error) {
            console.warn("Redis shutdown failed; closing its socket:", error instanceof Error ? error.message : error);
            client.disconnect();
        }
    }
}
