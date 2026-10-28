import mongoose, { Schema } from "mongoose";
import type { HydratedDocument, Model, Types } from "mongoose";

export interface ISession {
    userId: Types.ObjectId;
    token: string;
    expiresAt: Date;
    userAgent: string;
    createdAt: Date;
    updatedAt: Date;
}

export type SessionDocument = HydratedDocument<ISession>;

const sessionSchema = new Schema<ISession>(
    {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
        token: { type: String, required: true, unique: true }, // unique index on token
        expiresAt: { type: Date, required: true },
        userAgent: { type: String, default: "unknown", trim: true, maxlength: 500 },
    },
    { timestamps: true },
);

// TTL index: MongoDB removes a session automatically once `expiresAt` has passed.
// (The cleanup job runs about once a minute, so the auth middleware still checks expiry itself.)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Session: Model<ISession> =
    (mongoose.models.Session as Model<ISession> | undefined) ?? mongoose.model<ISession>("Session", sessionSchema);
