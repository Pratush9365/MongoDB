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
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true },
        userAgent: { type: String, default: "unknown", trim: true, maxlength: 500 },
    },
    {
        timestamps: true,
        toJSON: {
            transform: (_doc, ret: Record<string, unknown>) => {
                delete ret.__v;
                return ret;
            },
        },
    },
);

// Part 6: sessions — unique index on token
sessionSchema.index({ token: 1 }, { unique: true });
// Part 6: sessions — TTL index on expiresAt (MongoDB deletes the doc once expiresAt has passed)
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
sessionSchema.index({ userId: 1 });

export const Session: Model<ISession> =
    (mongoose.models.Session as Model<ISession> | undefined) ?? mongoose.model<ISession>("Session", sessionSchema);
