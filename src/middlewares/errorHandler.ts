import type { ErrorRequestHandler, RequestHandler } from "express";
import mongoose from "mongoose";
import { HTTP_STATUS, MESSAGES } from "../constants/constants";
import { AppError } from "../utils/appError";

const DUPLICATE_KEY_CODE = 11000;

interface ErrorBody {
    success: false;
    message: string;
}

function hasNumber(error: unknown, key: "code" | "status"): number | undefined {
    if (typeof error !== "object" || error === null || !(key in error)) return undefined;
    const value = (error as Record<string, unknown>)[key];
    return typeof value === "number" ? value : undefined;
}

/** Turns any thrown error into { statusCode, message }. Raw errors and stacks are never exposed. */
function toResponse(error: unknown): { statusCode: number; message: string } {
    if (error instanceof AppError) return { statusCode: error.statusCode, message: error.message };

    if (error instanceof mongoose.Error.ValidationError) {
        const message = Object.values(error.errors).map((issue) => issue.message).join(", ");
        return { statusCode: HTTP_STATUS.BAD_REQUEST, message };
    }
    if (error instanceof mongoose.Error.CastError) {
        return { statusCode: HTTP_STATUS.BAD_REQUEST, message: `Invalid value for ${error.path}` };
    }
    if (hasNumber(error, "code") === DUPLICATE_KEY_CODE) {
        return { statusCode: HTTP_STATUS.CONFLICT, message: "A record with this value already exists" };
    }

    // body-parser (malformed JSON, payload too large...) sets a 4xx `status`.
    const status = hasNumber(error, "status");
    if (status !== undefined && status >= 400 && status < 500) {
        return {
            statusCode: status,
            message: status === HTTP_STATUS.BAD_REQUEST ? MESSAGES.INVALID_JSON : "Request could not be processed",
        };
    }

    console.error("Unhandled error:", error);
    return { statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR, message: MESSAGES.INTERNAL_SERVER_ERROR };
}

/** Unknown routes: 404 in the standard error format. */
export const notFoundHandler: RequestHandler = (_req, res) => {
    const body: ErrorBody = { success: false, message: MESSAGES.ROUTE_NOT_FOUND };
    res.status(HTTP_STATUS.NOT_FOUND).json(body);
};

/** Global error handler. Every error response is { "success": false, "message": "..." }. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
    const { statusCode, message } = toResponse(error);
    const body: ErrorBody = { success: false, message };
    res.status(statusCode).json(body);
};
