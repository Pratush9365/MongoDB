import type { Server } from "node:http";
import { app } from "./app";
import { getConfig } from "./constants/config";
import { MongoDatabase } from "./providers/database";

let server: Server | undefined;

async function shutdown(signal: string): Promise<void> {
    console.log(`${signal} received, shutting down...`);
    server?.close();
    await MongoDatabase.closeConn();
    process.exit(0);
}

async function bootstrap(): Promise<void> {
    const config = getConfig(); // fails fast, with a clear message, if .env is incomplete

    // Connect first: the API must not accept requests it cannot serve.
    await MongoDatabase.initConn();

    server = app.listen(config.port, () => {
        console.log(`Server listening on port ${config.port} (${config.nodeEnv})`);
    });
    server.on("error", (error: Error) => {
        console.error(`Failed to listen on port ${config.port}:`, error.message);
        process.exit(1);
    });

    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
}

bootstrap().catch((error: unknown) => {
    console.error("Failed to start server:", error instanceof Error ? error.message : error);
    process.exit(1);
});
