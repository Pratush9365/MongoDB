import mongoose, { Schema } from "mongoose";
import type { HydratedDocument, Model, Types } from "mongoose";
import { COMMENT } from "../constants/constants";

export interface IComment {
    postId: Types.ObjectId;
    userId: Types.ObjectId;
    userName: string;
    text: string;
    createdAt: Date;
    updatedAt: Date;
}

export type CommentDocument = HydratedDocument<IComment>;

const commentSchema = new Schema<IComment>(
    {
        postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        userName: { type: String, required: true, trim: true },
        text: {
            type: String,
            required: [true, "text is required"],
            trim: true,
            minlength: [COMMENT.TEXT_MIN_LENGTH, "text is required"],
            maxlength: [COMMENT.TEXT_MAX_LENGTH, `text must be at most ${COMMENT.TEXT_MAX_LENGTH} characters`],
        },
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

// Part 6: comments — compound index on { postId, createdAt }
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ userId: 1 });

export const Comment: Model<IComment> =
    (mongoose.models.Comment as Model<IComment> | undefined) ?? mongoose.model<IComment>("Comment", commentSchema);
