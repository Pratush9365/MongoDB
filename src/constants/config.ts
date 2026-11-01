import dotenv from "dotenv";

dotenv.config({ quiet: true });

const DEFAULT_PORT = 3000;

export interface Config {
    nodeEnv: string;
    port: number;
    mongoUri: string;
    redisUrl: string;
    /** Redis keys must share the same name as the MongoDB database, e.g. `blog_pratush:`. */
    redisKeyPrefix: string;
}

function readPort(value: string | undefined): number {
    if (value === undefined || value === "") return DEFAULT_PORT;
    const port = Number(value);// conveting the string value to number
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
        throw new Error(`PORT must be a number between 1 and 65535 (got "${value}")`);
    }
    return port;
}

/** The database name is the path after the host, e.g. ".../blog_asha?retryWrites=true". Without it MongoDB silently uses "test". */
function hasDatabaseName(uri: string): boolean {
    try {
        return new URL(uri).pathname.length > 1;
    } catch {
        return true; // unusual multi-host URIs: let the driver validate it
    }
}

function readMongoUri(value: string | undefined): string {
    if (value === undefined || value.trim() === "") {
        throw new Error("MONGODB_URI is missing. Copy .env.example to .env and fill in your Atlas connection string.");
    }
    const uri = value.trim();
    if (/[<>]/.test(uri)) {
        throw new Error("MONGODB_URI still contains placeholder values like <username>. Put your real Atlas connection string in .env.");
    }
    if (!hasDatabaseName(uri)) {
        throw new Error("MONGODB_URI has no database name. End it with the database, e.g. .../blog_<yourname>?retryWrites=true&w=majority");
    }
    return uri;
}

function readRedisUrl(value: string | undefined): string {
    if (value === undefined || value.trim() === "") {
        throw new Error("REDIS_URL is missing. Add a Redis connection string to .env, e.g. redis://localhost:6379.");
    }

    const uri = value.trim();
    try {
        const protocol = new URL(uri).protocol;
        if (protocol !== "redis:" && protocol !== "rediss:") {
            throw new Error("unsupported protocol");
        }
    } catch {
        throw new Error("REDIS_URL must be a valid redis:// or rediss:// connection string.");
    }
    return uri;
}

function readDatabaseName(mongoUri: string): string {
    try {
        const databaseName = decodeURIComponent(new URL(mongoUri).pathname.replace(/^\/+/, "").split("/")[0] ?? "");
        if (databaseName) return databaseName;
    } catch {
        // readMongoUri has already validated ordinary MongoDB connection strings. Keep the error actionable here.
    }
    throw new Error("MONGODB_URI must include a database name so Redis keys can use the same prefix.");
}

let cached: Config | undefined;

/**
 * Environment configuration, read once. Called from the startup code (not at import time)
 * so a missing or placeholder value becomes one clear error message instead of a crash trace.
 */
export function getConfig(): Config {
    if (!cached) {
        const mongoUri = readMongoUri(process.env.MONGODB_URI);
        cached = {
            nodeEnv: process.env.NODE_ENV ?? "development",
            port: readPort(process.env.PORT),
            mongoUri,
            redisUrl: readRedisUrl(process.env.REDIS_URL),
            redisKeyPrefix: readDatabaseName(mongoUri),
        };
    }
    return cached;
}
