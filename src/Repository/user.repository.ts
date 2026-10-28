import { User } from "../model/user.model";
import type { UserDocument } from "../model/user.model";
import type { IUserPayload } from "../Modules/user/user.interface";

/** Database layer for users: the only place that talks to the User model. */
export class UserRepository {
    public async setUser(user: IUserPayload): Promise<UserDocument> {
        const dataToSave: IUserPayload = { name: user.name };
        // `!== undefined`, not truthiness: an age of 0 is a valid value and must not be dropped.
        if (user.age !== undefined) dataToSave.age = user.age;
        return User.create(dataToSave);
    }

    public async getUser() {
        return User.find().sort({ createdAt: -1 }).lean();
    }
}

export const userRepo = new UserRepository();
