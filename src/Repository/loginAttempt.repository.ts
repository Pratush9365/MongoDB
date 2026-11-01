import { LoginAttempt } from "../model/loginAttempt.model";
import type { LoginAttemptDocument } from "../model/loginAttempt.model";

/** Database layer for login rate-limit records (Part 7 bonus). */
export class LoginAttemptRepository {
    public findByEmail(email: string): Promise<LoginAttemptDocument | null> {
        return LoginAttempt.findOne({ email }).exec();
    }

    public async upsertFailure(
        email: string,
        failedCount: number,
        windowStartedAt: Date,
        lockedUntil: Date | null,
    ): Promise<LoginAttemptDocument> {
        const doc = await LoginAttempt.findOneAndUpdate(
            { email },
            { failedCount, windowStartedAt, lockedUntil },
            { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        ).exec();
        return doc as LoginAttemptDocument;
    }

    public async clear(email: string): Promise<void> {
        await LoginAttempt.deleteOne({ email }).exec();
    }
}

export const loginAttemptRepo = new LoginAttemptRepository();
