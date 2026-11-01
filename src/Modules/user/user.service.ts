import type { UserDocument } from "../../model/user.model";
import { userRepo } from "../../Repository/user.repository";
import type { UserRepository } from "../../Repository/user.repository";
import { AppError } from "../../utils/appError";
import type { IUpdateProfilePayload, PublicUser } from "./user.interface";

/** Builds the response shape for a user. Written field by field so the password can never leak. */
export function toPublicUser(user: UserDocument): PublicUser {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    };
}

export class UserService {
    public constructor(private readonly repository: UserRepository = userRepo) {}

    /** The auth middleware already loaded the user; this only shapes it for the response. */
    public getProfile(user: UserDocument): PublicUser {
        return toPublicUser(user);
    }

    /** Users can change their name only. */
    public async updateProfile(user: UserDocument, payload: IUpdateProfilePayload): Promise<PublicUser> {
        const updated = await this.repository.updateName(user._id, payload.name);
        if (!updated) throw AppError.notFound("User not found");
        return toPublicUser(updated);
    }
}
