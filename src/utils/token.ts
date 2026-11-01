import { randomBytes } from "node:crypto";
import { AUTH } from "../constants/constants";

/** Cryptographically secure random session token (64 hex characters). */
export function generateToken(): string {
    return randomBytes(AUTH.TOKEN_BYTES).toString("hex");
}
