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
