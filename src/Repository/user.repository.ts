import type { Types } from "mongoose";
import { User } from "../model/user.model";
import type { UserDocument } from "../model/user.model";

export interface NewUser {
    name: string;
    email: string;
    /** Already hashed. */
    password: string;
}

/** Database layer for users: the only place that talks to the User model. */
export class UserRepository {
    public create(user: NewUser): Promise<UserDocument> {
        return User.create(user);
    }

    /** Includes the password hash (it is hidden by default). Only for the login check. */
    public findByEmailWithPassword(email: string): Promise<UserDocument | null> {
        return User.findOne({ email }).select("+password").exec();
    }

    public findByEmail(email: string): Promise<UserDocument | null> {
        return User.findOne({ email }).exec();
    }

    public findById(id: Types.ObjectId | string): Promise<UserDocument | null> {
        return User.findById(id).exec();
    }

    public updateName(id: Types.ObjectId | string, name: string): Promise<UserDocument | null> {
        return User.findByIdAndUpdate(id, { name }, { returnDocument: "after", runValidators: true }).exec();
    }
}

export const userRepo = new UserRepository();
