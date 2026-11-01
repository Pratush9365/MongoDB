import mongoose, { Schema } from "mongoose";
import type { HydratedDocument, Model } from "mongoose";
import { AUTH } from "../constants/constants";

export interface IUser {
    name: string;
    email: string;
    /** bcrypt hash, never the plain password. Hidden from queries unless asked for with .select("+password"). */
    password: string;
    createdAt: Date;
    updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
    {
        name: {
            type: String,
            required: [true, "name is required"],
            trim: true,
            minlength: [AUTH.NAME_MIN_LENGTH, `name must be at least ${AUTH.NAME_MIN_LENGTH} characters`],
            maxlength: [AUTH.NAME_MAX_LENGTH, `name must be at most ${AUTH.NAME_MAX_LENGTH} characters`],
        },
        email: {
            type: String,
            required: [true, "email is required"],
            unique: true, // unique index on email
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            required: [true, "password is required"],
            minlength: [AUTH.PASSWORD_MIN_LENGTH, `password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters`],
            select: false,
        },
    },
    {
        timestamps: true,
        toJSON: {
            // Safety net: even if a document is serialized by accident, the password never leaves the server.
            transform: (_doc, ret: Record<string, unknown>) => {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    },
);

/** Reuses the model if this file is evaluated twice (watch mode / tests), instead of throwing OverwriteModelError. */
export const User: Model<IUser> = (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>("User", userSchema);
