import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/constants";
import { HealthService } from "./health.service";

export class HealthController {
    public constructor(private readonly service = new HealthService()) {}

    /** GET /api/health -> { status: "ok" } */
    public check = (_req: Request, res: Response): void => {
        res.status(HTTP_STATUS.OK).json(this.service.getStatus());
    };
}
