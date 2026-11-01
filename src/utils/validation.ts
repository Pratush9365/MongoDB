import { AUTH } from "../constants/constants";
import { AppError } from "./appError";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

/** Express 5 leaves req.body undefined when no body was sent. Always work with a plain object. */
export function asBody(body: unknown): Record<string, unknown> {
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
        throw AppError.badRequest("Request body must be a JSON object");
    }
    return body as Record<string, unknown>;
}

export function readName(value: unknown): string {
    if (typeof value !== "string") throw AppError.badRequest("name is required");
    const name = value.trim();
    if (name.length < AUTH.NAME_MIN_LENGTH) {
        throw AppError.badRequest(`name must be at least ${AUTH.NAME_MIN_LENGTH} characters`);
    }
    if (name.length > AUTH.NAME_MAX_LENGTH) {
        throw AppError.badRequest(`name must be at most ${AUTH.NAME_MAX_LENGTH} characters`);
    }
    return name;
}

/** Returns the email trimmed and lowercased, the same way it is stored. */
export function readEmail(value: unknown): string {
    if (typeof value !== "string") throw AppError.badRequest("email is required");
    const email = value.trim().toLowerCase();
    if (email.length === 0) throw AppError.badRequest("email is required");
    if (email.length > MAX_EMAIL_LENGTH || !EMAIL_PATTERN.test(email)) {
        throw AppError.badRequest("email must be a valid email address");
    }
    return email;
}

/** Rules for choosing a NEW password (signup). */
export function readNewPassword(value: unknown): string {
    if (typeof value !== "string" || value.length === 0) throw AppError.badRequest("password is required");
    if (value.length < AUTH.PASSWORD_MIN_LENGTH) {
        throw AppError.badRequest(`password must be at least ${AUTH.PASSWORD_MIN_LENGTH} characters`);
    }
    if (Buffer.byteLength(value, "utf8") > AUTH.PASSWORD_MAX_BYTES) {
        throw AppError.badRequest(`password must be at most ${AUTH.PASSWORD_MAX_BYTES} bytes`);
    }
    return value;
}
