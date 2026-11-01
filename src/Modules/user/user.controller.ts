import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/constants";
import { getAuth } from "../../middlewares/auth.middleware";
import { asBody, readName } from "../../utils/validation";
import { UserService } from "./user.service";

export class UserController {
    public constructor(private readonly service = new UserService()) {}

    /** GET /api/users/me */
    public getMe = async (req: Request, res: Response): Promise<void> => {
        const { user } = getAuth(req);
        const { profile, cacheHit } = await this.service.getProfile(user);
        res.set("X-Cache", cacheHit ? "HIT" : "MISS");
        res.status(HTTP_STATUS.OK).json({ success: true, data: profile });
    };

    /** PATCH /api/users/me: the name is the only field a user may change. */
    public updateMe = async (req: Request, res: Response): Promise<void> => {
        const { user } = getAuth(req);
        const body = asBody(req.body);
        const updated = await this.service.updateProfile(user, { name: readName(body.name) });
        res.status(HTTP_STATUS.OK).json({ success: true, data: updated });
    };
}
