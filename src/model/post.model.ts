import mongoose, { Schema } from "mongoose";
import type { HydratedDocument, Model, Types } from "mongoose";
import { POST } from "../constants/constants";
import type { PostStatus } from "../constants/constants";

export interface IPost {
    title: string;
    body: string;
    tags: string[];
    author: Types.ObjectId;
    authorName: string;
    status: PostStatus;
    commentCount: number;
    createdAt: Date;
    updatedAt: Date;
}

export type PostDocument = HydratedDocument<IPost>;

const postSchema = new Schema<IPost>(
    {
        title: {
            type: String,
            required: [true, "title is required"],
            trim: true,
            minlength: [POST.TITLE_MIN_LENGTH, `title must be at least ${POST.TITLE_MIN_LENGTH} characters`],
            maxlength: [POST.TITLE_MAX_LENGTH, `title must be at most ${POST.TITLE_MAX_LENGTH} characters`],
        },
        body: {
            type: String,
            required: [true, "body is required"],
            trim: true,
            minlength: [POST.BODY_MIN_LENGTH, `body must be at least ${POST.BODY_MIN_LENGTH} characters`],
        },
        tags: {
            type: [
                {
                    type: String,
                    lowercase: true,
                    trim: true,
                    maxlength: [POST.TAG_MAX_LENGTH, `each tag must be at most ${POST.TAG_MAX_LENGTH} characters`],
                },
            ],
            default: [],
            validate: {
                validator: (tags: string[]) => tags.length <= POST.MAX_TAGS,
                message: `tags allows at most ${POST.MAX_TAGS} items`,
            },
        },
        author: { type: Schema.Types.ObjectId, ref: "User", required: true },
        authorName: { type: String, required: true, trim: true },
        status: {
            type: String,
            enum: {
                values: POST.STATUSES as unknown as string[],
                message: `status must be one of: ${POST.STATUSES.join(", ")}`,
            },
            default: "draft",
        },
        commentCount: { type: Number, default: 0, min: 0 },
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

// Part 6: posts — index on tags; compound index on { status, createdAt }
postSchema.index({ tags: 1 });
postSchema.index({ status: 1, createdAt: -1 });
postSchema.index({ author: 1 });

export const Post: Model<IPost> =
    (mongoose.models.Post as Model<IPost> | undefined) ?? mongoose.model<IPost>("Post", postSchema);
