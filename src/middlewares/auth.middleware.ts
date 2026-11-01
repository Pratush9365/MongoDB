import type { Request, RequestHandler } from "express";
import { MESSAGES } from "../constants/constants";
import type { SessionDocument } from "../model/session.model";
import type { UserDocument } from "../model/user.model";
import { authService } from "../Modules/auth/auth.service";
import { AppError } from "../utils/appError";

/** Accepts "Authorization: Bearer <token>" (a bare token is tolerated too). */
function readToken(req: Request): string {
    const header = req.headers.authorization?.trim();
    if (!header) throw AppError.unauthorized(MESSAGES.AUTH_REQUIRED);

    const parts = header.split(/\s+/);
    if (parts.length === 1) return parts[0] as string;
    if (parts.length === 2 && parts[0]?.toLowerCase() === "bearer") return parts[1] as string;
    throw AppError.unauthorized(MESSAGES.AUTH_REQUIRED);
}

/**
 * Protects a route: reads the token, finds a non-expired session in the database
 * and attaches the user and session to the request. Missing, invalid or expired token -> 401.
 */
export const requireAuth: RequestHandler = async (req, _res, next) => {
    try {
        const { user, session } = await authService.authenticate(readToken(req));
        req.user = user;
        req.session = session;
        next();
    } catch (error) {
        next(error);
    }
};

/** For handlers that run after requireAuth: returns the attached user/session without non-null assertions. */
export function getAuth(req: Request): { user: UserDocument; session: SessionDocument } {
    if (!req.user || !req.session) throw AppError.unauthorized(MESSAGES.AUTH_REQUIRED);
    return { user: req.user, session: req.session };
}
