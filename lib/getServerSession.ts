import { getServerSession as _getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/auth-options";

/**
 * Server-only helper — call from Server Components, Route Handlers, and middleware.
 *
 * Reads the session directly from the encrypted JWT cookie without an HTTP
 * round-trip. Use this instead of getSession() (client) or the raw
 * _getServerSession(authOptions) call to keep authOptions import in one place.
 *
 * Returns null when the user is unauthenticated or the cookie is absent.
 */
export async function getServerSession() {
    return _getServerSession(authOptions);
}
