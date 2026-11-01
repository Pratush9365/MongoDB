import type { UserDocument } from "../model/user.model";
import type { AuthenticatedSession } from "../Modules/auth/auth.interface";

declare global {
    namespace Express {
        interface Request {
            /** Set by requireAuth: the logged-in user. */
            user?: UserDocument;
            /** Set by requireAuth: the session the request's token belongs to. */
            session?: AuthenticatedSession;
        }
    }
}

export {};
