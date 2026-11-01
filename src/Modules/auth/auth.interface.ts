import type { PublicUser } from "../user/user.interface";

export interface ISignupPayload {
    name: string;
    email: string;
    password: string;
}

export interface ILoginPayload {
    email: string;
    password: string;
}

export interface ILoginResult {
    token: string;
    expiresAt: Date;
    user: PublicUser;
}

/** Minimal session context needed after authentication; it works for Redis and MongoDB session lookups alike. */
export interface AuthenticatedSession {
    token: string;
    userId: string;
}
