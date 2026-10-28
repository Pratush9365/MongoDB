import type { SessionDocument } from "../model/session.model";
import type { UserDocument } from "../model/user.model";

declare global {
    namespace Express {
        interface Request {
            /** Set by requireAuth: the logged-in user. */
            user?: UserDocument;
            /** Set by requireAuth: the session the request's token belongs to. */
            session?: SessionDocument;
        }
    }
}

export {};
