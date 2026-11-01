import { RedisProvider } from "../providers/redis";

/** Indicates whether a cached endpoint read its value from Redis or rebuilt it from MongoDB. */
export interface CacheResult<T> {
    value: T;
    hit: boolean;
}

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

/**
 * Redis is an optimization after startup. Every command is fail-soft so an outage
 * returns the fallback and leaves MongoDB as the source of truth.
 */
async function safelyRun<T>(operation: string, fallback: T, action: () => Promise<T>): Promise<T> {
    try {
        return await action();
    } catch (error) {
        console.error(`Redis ${operation} failed:`, errorMessage(error));
        return fallback;
    }
}

export async function getJSON<T>(key: string): Promise<T | null> {
    const raw = await safelyRun("GET", null, () => RedisProvider.getClient().get(key));
    if (raw === null) return null;

    try {
        return JSON.parse(raw) as T;
    } catch (error) {
        console.error(`Redis JSON parse failed for key ${key}:`, errorMessage(error));
        await delKeys(key);
        return null;
    }
}

export async function setJSON<T>(key: string, value: T, ttlSeconds: number): Promise<boolean> {
    if (ttlSeconds <= 0) return false;
    const encoded = JSON.stringify(value);
    const result = await safelyRun("SET", null, () => RedisProvider.getClient().set(key, encoded, "EX", ttlSeconds));
    return result === "OK";
}

export async function getString(key: string): Promise<string | null> {
    return safelyRun("GET", null, () => RedisProvider.getClient().get(key));
}

export async function setString(key: string, value: string, ttlSeconds: number): Promise<boolean> {
    if (ttlSeconds <= 0) return false;
    const result = await safelyRun("SET", null, () => RedisProvider.getClient().set(key, value, "EX", ttlSeconds));
    return result === "OK";
}

/** Delete one or more precise keys. No code in this project uses Redis KEYS. */
export async function delKeys(...keys: string[]): Promise<void> {
    const uniqueKeys = [...new Set(keys.filter(Boolean))];
    if (uniqueKeys.length === 0) return;
    await safelyRun("DEL", 0, () => RedisProvider.getClient().del(...uniqueKeys));
}

export async function increment(key: string): Promise<number | null> {
    return safelyRun("INCR", null, () => RedisProvider.getClient().incr(key));
}

/** Implements the required INCR + first-failure EXPIRE login-window behaviour. */
export async function incrementWithExpiry(key: string, ttlSeconds: number): Promise<number | null> {
    const count = await increment(key);
    if (count === 1) {
        await safelyRun("EXPIRE", 0, () => RedisProvider.getClient().expire(key, ttlSeconds));
    }
    return count;
}

export async function getTtlSeconds(key: string): Promise<number | null> {
    return safelyRun("TTL", null, () => RedisProvider.getClient().ttl(key));
}

/** Adds a session token to a user's Set and keeps the Set's TTL aligned with the newest session. */
export async function addToSetWithExpiry(key: string, member: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return;
    await safelyRun("SADD", 0, () => RedisProvider.getClient().sadd(key, member));
    await safelyRun("EXPIRE", 0, () => RedisProvider.getClient().expire(key, ttlSeconds));
}

export async function removeSetMember(key: string, member: string): Promise<void> {
    await safelyRun("SREM", 0, () => RedisProvider.getClient().srem(key, member));
}

export async function getSetMembers(key: string): Promise<string[]> {
    return safelyRun("SMEMBERS", [], () => RedisProvider.getClient().smembers(key));
}

/** `SET ... NX EX ...` is used only to prevent a burst of stats requests from all aggregating at once. */
export async function setIfAbsentWithExpiry(key: string, value: string, ttlSeconds: number): Promise<boolean | null> {
    try {
        // `null` is a normal Redis reply when the lock already exists, so it cannot share safelyRun's error fallback.
        const result = await RedisProvider.getClient().set(key, value, "EX", ttlSeconds, "NX");
        return result === "OK";
    } catch (error) {
        console.error("Redis SET NX failed:", errorMessage(error));
        return null;
    }
}
