import type { NextFunction, Request, RequestHandler, Response } from "express";

/**
 * Part 6: validation lives in utils/validation.ts and runs inside controllers
 * before any DB write. This helper keeps async route handlers safe so thrown
 * AppErrors (and unexpected failures) always reach the global error handler —
 * never as a raw stack in the HTTP response.
 */
export function asyncHandler(
    handler: (req: Request, res: Response, next: NextFunction) => unknown,
): RequestHandler {
    return (req, res, next) => {
        Promise.resolve(handler(req, res, next)).catch(next);
    };
}
