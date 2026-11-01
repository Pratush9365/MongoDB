import type { Request, Response } from "express";
import { HTTP_STATUS, MESSAGES } from "../../constants/constants";
import { getAuth } from "../../middlewares/auth.middleware";
import { AppError } from "../../utils/appError";
import { asBody, readEmail, readNewPassword, readName } from "../../utils/validation";
import { AuthService, authService } from "./auth.service";
import type { ILoginPayload, ISignupPayload } from "./auth.interface";

export class AuthController {
    public constructor(private readonly service: AuthService = authService) {}

    /** POST /api/auth/signup */
    public signup = async (req: Request, res: Response): Promise<void> => {
        const body = asBody(req.body);
        const payload: ISignupPayload = {
            name: readName(body.name),
            email: readEmail(body.email),
            password: readNewPassword(body.password),
        };
        const user = await this.service.signup(payload);
        res.status(HTTP_STATUS.CREATED).json({ success: true, data: { user } });
    };

    /** POST /api/auth/login */
    public login = async (req: Request, res: Response): Promise<void> => {
        const body = asBody(req.body);
        // A malformed email or empty password can never match an account, so it gets the same 401 as a wrong one.
        if (typeof body.email !== "string" || typeof body.password !== "string" || body.password.length === 0) {
            throw AppError.unauthorized(MESSAGES.INVALID_CREDENTIALS);
        }
        const payload: ILoginPayload = { email: body.email.trim().toLowerCase(), password: body.password };
        const userAgent = req.get("user-agent") ?? "unknown";

        const { token, expiresAt, user } = await this.service.login(payload, userAgent);
        res.status(HTTP_STATUS.OK).json({ success: true, data: { token, expiresAt, user } });
    };

    /** POST /api/auth/logout */
    public logout = async (req: Request, res: Response): Promise<void> => {
        const { session } = getAuth(req);
        await this.service.logout(session);
        res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.LOGGED_OUT });
    };

    /** POST /api/auth/logout-all (bonus): ends every session of the user, on every device. */
    public logoutAll = async (req: Request, res: Response): Promise<void> => {
        const { user } = getAuth(req);
        await this.service.logoutAll(user);
        res.status(HTTP_STATUS.OK).json({ success: true, message: MESSAGES.LOGGED_OUT_ALL });
    };
}
