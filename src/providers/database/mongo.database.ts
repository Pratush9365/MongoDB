import mongoose from "mongoose";
import { getConfig } from "../../constants/config";

const SERVER_SELECTION_TIMEOUT_MS = 10_000;

/** Owns the single Mongoose connection. The connection string comes from MONGODB_URI, never from source code. */
export class MongoDatabase {
    private static listenersAttached = false;

    private static attachListeners(): void {
        if (MongoDatabase.listenersAttached) return;
        MongoDatabase.listenersAttached = true;
        mongoose.connection.on("error", (error: Error) => console.error("MongoDB connection error:", error.message));
        mongoose.connection.on("disconnected", () => console.warn("MongoDB disconnected"));
    }

    public static async initConn(): Promise<void> {
        MongoDatabase.attachListeners();
        await mongoose.connect(getConfig().mongoUri, { serverSelectionTimeoutMS: SERVER_SELECTION_TIMEOUT_MS });
        console.log(`DB connection initialized (database: ${mongoose.connection.name})`);
    }

    public static async closeConn(): Promise<void> {
        await mongoose.disconnect();
    }
}
