import express from "express";
import type { Express } from "express";
import { API_PREFIX } from "./constants/constants";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";
import routes from "./routes";

export function createApp(): Express {
    const app = express();
    app.disable("x-powered-by");
    app.use(express.json({ limit: "100kb" }));

    app.use(API_PREFIX, routes);

    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}

export const app = createApp();
