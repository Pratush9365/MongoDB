import { HTTP_STATUS } from "../constants/constants";

/** An error whose message is safe to show to the client. Anything else becomes a generic 500. */
export class AppError extends Error {
    public readonly statusCode: number;

    public constructor(statusCode: number, message: string) {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
    }

    public static badRequest(message: string): AppError { return new AppError(HTTP_STATUS.BAD_REQUEST, message); }
    public static unauthorized(message: string): AppError { return new AppError(HTTP_STATUS.UNAUTHORIZED, message); }
    public static forbidden(message: string): AppError { return new AppError(HTTP_STATUS.FORBIDDEN, message); }
    public static notFound(message: string): AppError { return new AppError(HTTP_STATUS.NOT_FOUND, message); }
    public static conflict(message: string): AppError { return new AppError(HTTP_STATUS.CONFLICT, message); }
}
