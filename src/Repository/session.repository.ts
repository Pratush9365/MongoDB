import type { Types } from "mongoose";
import { Session } from "../model/session.model";
import type { SessionDocument } from "../model/session.model";

export interface NewSession {
    userId: Types.ObjectId;
    token: string;
    expiresAt: Date;
    userAgent: string;
}

/** Database layer for sessions. */
export class SessionRepository {
    public create(session: NewSession): Promise<SessionDocument> {
        return Session.create(session);
    }

    /** Only returns a session that has not expired yet (the TTL cleanup can lag by up to a minute). */
    public findActiveByToken(token: string): Promise<SessionDocument | null> {
        return Session.findOne({ token, expiresAt: { $gt: new Date() } }).exec();
    }

    public async deleteByToken(token: string): Promise<void> {
        await Session.deleteOne({ token }).exec();
    }

    public async deleteAllForUser(userId: Types.ObjectId | string): Promise<number> {
        const result = await Session.deleteMany({ userId }).exec();
        return result.deletedCount;
    }
}

export const sessionRepo = new SessionRepository();
