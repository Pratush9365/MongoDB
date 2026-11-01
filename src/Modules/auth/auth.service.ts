import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { AUTH, MESSAGES } from "../../constants/constants";
import { REDIS_TTL, redisKeys } from "../../constants/redis";
import type { UserDocument } from "../../model/user.model";
import { sessionRepo } from "../../Repository/session.repository";
import type { SessionRepository } from "../../Repository/session.repository";
import { userRepo } from "../../Repository/user.repository";
import type { UserRepository } from "../../Repository/user.repository";
import { AppError } from "../../utils/appError";
import {
    addToSetWithExpiry,
    delKeys,
    getSetMembers,
    getString,
    getTtlSeconds,
    incrementWithExpiry,
    removeSetMember,
    setString,
} from "../../utils/cache";
import { generateToken } from "../../utils/token";
import { toPublicUser } from "../user/user.service";
import type { PublicUser } from "../user/user.interface";
import type { AuthenticatedSession, ILoginPayload, ILoginResult, ISignupPayload } from "./auth.interface";

const DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
    return typeof error === "object" && error !== null && (error as { code?: unknown }).code === DUPLICATE_KEY_CODE;
}

/** Hash that is compared against when the email is unknown, so "no such user" takes as long as "wrong password". */
let dummyHash: Promise<string> | undefined;
function getDummyHash(): Promise<string> {
    dummyHash ??= bcrypt.hash("not-a-real-password", AUTH.BCRYPT_ROUNDS);
    return dummyHash;
}

export class AuthService {
    public constructor(
        private readonly users: UserRepository = userRepo,
        private readonly sessions: SessionRepository = sessionRepo,
    ) {}

    public async signup(payload: ISignupPayload): Promise<PublicUser> {
        if (await this.users.findByEmail(payload.email)) throw AppError.conflict(MESSAGES.EMAIL_TAKEN);

        const password = await bcrypt.hash(payload.password, AUTH.BCRYPT_ROUNDS);
        try {
            const user = await this.users.create({ name: payload.name, email: payload.email, password });
            return toPublicUser(user);
        } catch (error) {
            // Two signups with the same email at the same moment: the unique index decides the loser.
            if (isDuplicateKeyError(error)) throw AppError.conflict(MESSAGES.EMAIL_TAKEN);
            throw error;
        }
    }

    public async login(payload: ILoginPayload, userAgent: string): Promise<ILoginResult> {
        await this.assertNotRateLimited(payload.email);

        const user = await this.users.findByEmailWithPassword(payload.email);

        // Same work and same message for "unknown email" and "wrong password": never reveal which one it was.
        const hash = user?.password ?? (await getDummyHash());
        const passwordMatches = await bcrypt.compare(payload.password, hash);
        if (!user || !passwordMatches) {
            await this.recordFailedLogin(payload.email);
            throw AppError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
        }

        await delKeys(redisKeys.loginFailures(payload.email));

        const session = await this.sessions.create({
            userId: user._id,
            token: generateToken(),
            expiresAt: new Date(Date.now() + AUTH.SESSION_TTL_MS),
            userAgent,
        });
        await this.cacheSession(session.token, user._id.toString(), session.expiresAt);
        return { token: session.token, expiresAt: session.expiresAt, user: toPublicUser(user) };
    }

    /** Resolves a token to its user. Redis avoids the MongoDB session lookup, but MongoDB remains authoritative. */
    public async authenticate(token: string): Promise<{ user: UserDocument; session: AuthenticatedSession }> {
        const cachedUserId = await getString(redisKeys.session(token));
        if (cachedUserId && Types.ObjectId.isValid(cachedUserId)) {
            const user = await this.users.findById(cachedUserId);
            if (user) return { user, session: { token, userId: user._id.toString() } };

            // A deleted account invalidates both the durable session and its fast Redis copy.
            await this.sessions.deleteByToken(token);
            await delKeys(redisKeys.session(token));
            await removeSetMember(redisKeys.userSessions(cachedUserId), token);
            throw AppError.unauthorized(MESSAGES.SESSION_INVALID);
        }
        if (cachedUserId) await delKeys(redisKeys.session(token));

        const session = await this.sessions.findActiveByToken(token);
        if (!session) throw AppError.unauthorized(MESSAGES.SESSION_INVALID);

        const user = await this.users.findById(session.userId);
        if (!user) {
            // The account is gone: the session is useless, remove it.
            await this.sessions.deleteByToken(token);
            throw AppError.unauthorized(MESSAGES.SESSION_INVALID);
        }
        await this.cacheSession(session.token, user._id.toString(), session.expiresAt);
        return { user, session: { token: session.token, userId: user._id.toString() } };
    }

    public async logout(session: AuthenticatedSession): Promise<void> {
        // MongoDB is changed first; cache cleanup can safely fail without reviving a session.
        await this.sessions.deleteByToken(session.token);
        await delKeys(redisKeys.session(session.token));
        await removeSetMember(redisKeys.userSessions(session.userId), session.token);
    }

    /** Part 7 bonus: delete every session for this user (all devices). */
    public async logoutAll(user: UserDocument): Promise<void> {
        await this.sessions.deleteAllForUser(user._id);

        const userId = user._id.toString();
        const sessionsKey = redisKeys.userSessions(userId);
        const tokens = await getSetMembers(sessionsKey);
        await delKeys(...tokens.map((token) => redisKeys.session(token)), sessionsKey);
    }

    private async assertNotRateLimited(email: string): Promise<void> {
        const key = redisKeys.loginFailures(email);
        const rawCount = await getString(key);
        const count = rawCount === null ? 0 : Number(rawCount);
        if (Number.isInteger(count) && count >= AUTH.LOGIN_MAX_ATTEMPTS) {
            const ttl = await getTtlSeconds(key);
            const secondsLeft = ttl !== null && ttl > 0 ? ttl : REDIS_TTL.LOGIN_FAILURE_SECONDS;
            const minutesLeft = Math.max(1, Math.ceil(secondsLeft / 60));
            throw AppError.tooManyRequests(`Too many login attempts. Try again in ${minutesLeft} minutes`);
        }
    }

    private async recordFailedLogin(email: string): Promise<void> {
        await incrementWithExpiry(redisKeys.loginFailures(email), AUTH.LOGIN_WINDOW_SECONDS);
    }

    /** Mirrors a durable MongoDB session in Redis until exactly the same expiry time. */
    private async cacheSession(token: string, userId: string, expiresAt: Date): Promise<void> {
        const secondsLeft = Math.max(1, Math.ceil((expiresAt.getTime() - Date.now()) / 1000));
        await setString(redisKeys.session(token), userId, secondsLeft);
        await addToSetWithExpiry(redisKeys.userSessions(userId), token, secondsLeft);
    }
}

export const authService = new AuthService();
