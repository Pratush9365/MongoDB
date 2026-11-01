import { Router } from "express";
import { openApiDocument, swaggerUiHtml } from "../docs/openapi";
import { HTTP_STATUS } from "../constants/constants";

const router = Router();

/** Part 7 bonus: Swagger UI (OpenAPI served locally; UI assets from CDN — no extra npm packages). */
router.get("/docs/openapi.json", (_req, res) => {
    res.status(HTTP_STATUS.OK).json(openApiDocument);
});

router.get("/docs", (_req, res) => {
    res.status(HTTP_STATUS.OK).type("html").send(swaggerUiHtml("/api/docs/openapi.json"));
});

export default router;
