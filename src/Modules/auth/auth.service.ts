import bcrypt from "bcryptjs";
import { AUTH, MESSAGES } from "../../constants/constants";
import type { SessionDocument } from "../../model/session.model";
import type { UserDocument } from "../../model/user.model";
import { sessionRepo } from "../../Repository/session.repository";
import type { SessionRepository } from "../../Repository/session.repository";
import { userRepo } from "../../Repository/user.repository";
import type { UserRepository } from "../../Repository/user.repository";
import { AppError } from "../../utils/appError";
import { generateToken } from "../../utils/token";
import { toPublicUser } from "../user/user.service";
import type { PublicUser } from "../user/user.interface";
import type { ILoginPayload, ILoginResult, ISignupPayload } from "./auth.interface";

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
        const user = await this.users.findByEmailWithPassword(payload.email);

        // Same work and same message for "unknown email" and "wrong password": never reveal which one it was.
        const hash = user?.password ?? (await getDummyHash());
        const passwordMatches = await bcrypt.compare(payload.password, hash);
        if (!user || !passwordMatches) throw AppError.unauthorized(MESSAGES.INVALID_CREDENTIALS);

        const session = await this.sessions.create({
            userId: user._id,
            token: generateToken(),
            expiresAt: new Date(Date.now() + AUTH.SESSION_TTL_MS),
            userAgent,
        });
        return { token: session.token, expiresAt: session.expiresAt, user: toPublicUser(user) };
    }

    /** Resolves a token to its session and user. Used by the auth middleware. */
    public async authenticate(token: string): Promise<{ user: UserDocument; session: SessionDocument }> {
        const session = await this.sessions.findActiveByToken(token);
        if (!session) throw AppError.unauthorized(MESSAGES.SESSION_INVALID);

        const user = await this.users.findById(session.userId);
        if (!user) {
            // The account is gone: the session is useless, remove it.
            await this.sessions.deleteByToken(token);
            throw AppError.unauthorized(MESSAGES.SESSION_INVALID);
        }
        return { user, session };
    }

    public logout(session: SessionDocument): Promise<void> {
        return this.sessions.deleteByToken(session.token);
    }

    public async logoutAll(user: UserDocument): Promise<void> {
        await this.sessions.deleteAllForUser(user._id);
    }
}

export const authService = new AuthService();
