import mongoose, { Schema } from "mongoose";
import type { HydratedDocument, Model } from "mongoose";

export interface ILoginAttempt {
    email: string;
    failedCount: number;
    windowStartedAt: Date;
    lockedUntil: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

export type LoginAttemptDocument = HydratedDocument<ILoginAttempt>;

const loginAttemptSchema = new Schema<ILoginAttempt>(
    {
        email: { type: String, required: true, lowercase: true, trim: true },
        failedCount: { type: Number, required: true, default: 0, min: 0 },
        windowStartedAt: { type: Date, required: true },
        lockedUntil: { type: Date, default: null },
    },
    { timestamps: true },
);

loginAttemptSchema.index({ email: 1 }, { unique: true });
// Drop stale attempt rows automatically a day after the last update.
loginAttemptSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

export const LoginAttempt: Model<ILoginAttempt> =
    (mongoose.models.LoginAttempt as Model<ILoginAttempt> | undefined) ??
    mongoose.model<ILoginAttempt>("LoginAttempt", loginAttemptSchema);
