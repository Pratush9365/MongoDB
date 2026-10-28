import mongoose, { Schema } from "mongoose";
import type { HydratedDocument, Model } from "mongoose";

export interface IUser {
    name: string;
    age?: number;
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
            minlength: [2, "name must be at least 2 characters"],
            maxlength: [50, "name must be at most 50 characters"],
        },
        age: {
            type: Number,
            required: false,
            min: [0, "age cannot be negative"],
            max: [150, "age is not realistic"],
        },
    },
    { timestamps: true },
);

/** Reuses the model if this file is evaluated twice (watch mode / tests), instead of throwing OverwriteModelError. */
export const User: Model<IUser> = (mongoose.models.User as Model<IUser> | undefined) ?? mongoose.model<IUser>("User", userSchema);
