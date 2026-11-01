import type { Request, Response } from "express";
import { HTTP_STATUS } from "../../constants/constants";
import { StatsService, statsService } from "./stats.service";

export class StatsController {
    public constructor(private readonly service: StatsService = statsService) {}

    /** GET /api/stats — public; one aggregation with $facet */
    public getStats = async (_req: Request, res: Response): Promise<void> => {
        const { stats, cacheHit } = await this.service.getBlogStats();
        res.set("X-Cache", cacheHit ? "HIT" : "MISS");
        res.status(HTTP_STATUS.OK).json({ success: true, data: stats });
    };
}
