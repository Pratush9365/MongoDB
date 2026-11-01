import type { UserDocument } from "../../model/user.model";
import { REDIS_TTL, redisKeys } from "../../constants/redis";
import { userRepo } from "../../Repository/user.repository";
import type { UserRepository } from "../../Repository/user.repository";
import { AppError } from "../../utils/appError";
import { delKeys, getJSON, setJSON } from "../../utils/cache";
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

    /** GET /users/me uses a one-hour public-profile cache. Passwords never enter this object. */
    public async getProfile(user: UserDocument): Promise<{ profile: PublicUser; cacheHit: boolean }> {
        const key = redisKeys.user(user._id.toString());
        const cached = await getJSON<PublicUser>(key);
        if (cached) return { profile: cached, cacheHit: true };

        const profile = toPublicUser(user);
        await setJSON(key, profile, REDIS_TTL.PROFILE_SECONDS);
        return { profile, cacheHit: false };
    }

    /** Users can change their name only. */
    public async updateProfile(user: UserDocument, payload: IUpdateProfilePayload): Promise<PublicUser> {
        const updated = await this.repository.updateName(user._id, payload.name);
        if (!updated) throw AppError.notFound("User not found");
        // MongoDB first, then remove the cached response so the next read is fresh.
        await delKeys(redisKeys.user(user._id.toString()));
        return toPublicUser(updated);
    }
}
