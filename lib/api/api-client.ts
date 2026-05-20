import { getCachedSession, invalidateSessionCache } from "@/lib/sessionCache";
import { LOCALE_COOKIE } from "@/lib/i18n/config";

const BASE_URL = "/api";
const MAX_AUTH_RETRIES = 1;
const AUTH_RETRY_DELAY = 300;

/**
 * Read the current locale — checks URL first (most up-to-date during switch),
 * then falls back to cookie.
 */
export function getClientLocale(): string {
    if (typeof window === "undefined") return "en";
    // URL is the source of truth (cookie may lag behind during language switch)
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    if (pathSegments[0] === "ar") return "ar";
    if (pathSegments[0] === "en") return "en";
    // Fallback to cookie
    const match = document.cookie.match(new RegExp(`${LOCALE_COOKIE}=([^;]+)`));
    return match?.[1] || "en";
}

const STORE_CODE_RE = /^[A-Za-z0-9_]+_(en|ar)$/;

/**
 * Read the active warehouse store code. Checks (in order):
 *  1. URL path prefix (e.g. /V101_en/checkout → "V101_en")
 *  2. localStorage selectedStoreCode (set by ProductsListing when browsing)
 *  3. NEXT_STORE cookie (set by middleware on warehouse page visits)
 * Returns empty string when no warehouse context exists.
 */
export function getClientStoreCode(): string {
    if (typeof window === "undefined") return "";
    const pathSegments = window.location.pathname.split("/").filter(Boolean);
    if (pathSegments[0] && STORE_CODE_RE.test(pathSegments[0])) return pathSegments[0];
    try {
        const ls = localStorage.getItem("selectedStoreCode");
        if (ls && STORE_CODE_RE.test(ls)) return ls;
    } catch { }
    const cookieMatch = document.cookie.match(/NEXT_STORE=([^;]+)/);
    if (cookieMatch && STORE_CODE_RE.test(cookieMatch[1])) return cookieMatch[1];
    return "";
}

/**
 * Get auth token — tries NextAuth session first, falls back to localStorage.
 * If no token found, waits briefly and retries (handles post-login race condition).
 */
function cleanToken(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const cleaned = raw.replace(/['"]/g, "").trim();
    if (!cleaned || cleaned === "null" || cleaned === "undefined") return null;
    return cleaned;
}

function isTokenExpired(token: string): boolean {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return false;
        const payload = JSON.parse(atob(parts[1]));
        if (!payload.exp) return false;
        // Treat as expired 30 seconds before actual expiry to avoid race conditions
        return Math.floor(Date.now() / 1000) >= (payload.exp - 30);
    } catch {
        return false;
    }
}

// Module-level token cache + inflight deduplicator.
// - Cache avoids a round-trip when the token was fetched recently (≤55s ago).
// - Inflight promise deduplicates concurrent calls: all callers that arrive while
//   getSession() is in-flight share the same promise instead of each firing a new request.
let _tokenCache: { token: string; fetchedAt: number } | null = null;
let _tokenInflight: Promise<string | null> | null = null;
const TOKEN_CACHE_TTL = 55_000; // 55s — refresh before NextAuth's default 60s refetch interval

export function invalidateTokenCache() {
    _tokenCache = null;
    _tokenInflight = null;
    invalidateSessionCache(); // bust shared session cache on sign-out
}

async function _resolveToken(): Promise<string | null> {
    // 1. localStorage FIRST — ProtectedLayout syncs the NextAuth token here on every
    //    auth state change, so this is always current without an HTTP round-trip.
    if (typeof window !== "undefined") {
        const localToken = cleanToken(localStorage.getItem("token"));
        if (localToken && !isTokenExpired(localToken)) {
            _tokenCache = { token: localToken, fetchedAt: Date.now() };
            return localToken;
        }
    }

    // 2. getCachedSession() only when localStorage is empty or expired — happens on
    //    first cold page load before ProtectedLayout has written the token.
    //    getCachedSession() deduplicates concurrent HTTP calls across all callers.
    try {
        const session: any = await getCachedSession();
        if (session?.accessToken) {
            const t = cleanToken(session.accessToken);
            if (t && !isTokenExpired(t)) {
                _tokenCache = { token: t, fetchedAt: Date.now() };
                return t;
            }
        }
    } catch {
        // getCachedSession() can fail in non-browser contexts
    }

    return null;
}

export async function getAuthToken(attempt = 0): Promise<string | null> {
    // Sub-account override: while impersonating a sub-account, use their token
    if (typeof window !== "undefined" && localStorage.getItem("isSubAccount") === "true") {
        const subToken = cleanToken(localStorage.getItem("subAccountToken"));
        if (subToken && !isTokenExpired(subToken)) return subToken;
    }

    // Use cached token if still fresh and not JWT-expired
    if (_tokenCache && Date.now() - _tokenCache.fetchedAt < TOKEN_CACHE_TTL) {
        if (!isTokenExpired(_tokenCache.token)) return _tokenCache.token;
        _tokenCache = null; // JWT expired — force re-fetch
    }

    // Deduplicate concurrent callers: if a getSession() is already in-flight,
    // all callers wait on the same promise instead of firing separate HTTP requests.
    if (_tokenInflight) return _tokenInflight;

    _tokenInflight = _resolveToken();
    try {
        const token = await _tokenInflight;
        if (token) return token;
    } finally {
        _tokenInflight = null;
    }

    // No valid token found — wait once for ProtectedLayout to write the token,
    // then read localStorage directly (NOT a new getSession() call).
    // This handles the post-login race where ProtectedLayout hasn't synced yet.
    if (attempt < 1) {
        await new Promise(r => setTimeout(r, 300));
        if (typeof window !== "undefined") {
            const delayed = cleanToken(localStorage.getItem("token"));
            if (delayed && !isTokenExpired(delayed)) {
                _tokenCache = { token: delayed, fetchedAt: Date.now() };
                return delayed;
            }
        }
    }

    return null;
}

async function apiClient(
    endpoint: string,
    { method = "GET", body, headers = {}, _retryCount = 0, ...customConfig }: any = {}
) {
    const token = await getAuthToken();

    const isFormData = body instanceof FormData;

    const config: any = {
        method,
        ...customConfig,
        headers: {
            ...(!isFormData && { "Content-Type": "application/json" }),
            // Pass the current locale to API routes via a custom header
            "x-locale": getClientLocale(),
            ...headers,
        },
    };

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (body) {
        config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);

        let data: any = null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            // Non-JSON response (e.g., HTML error page)
            const text = await response.text();
            console.error(`[api-client] Received non-JSON response from ${endpoint}:`, text.substring(0, 100));

            if (!response.ok) {
                throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            return text; // Or handle as needed
        }

        if (response.ok) {
            return data;
        }

        // Handle 401 — retry with fresh token before giving up
        if (response.status === 401 && _retryCount < MAX_AUTH_RETRIES) {
            await new Promise(r => setTimeout(r, AUTH_RETRY_DELAY));
            return apiClient(endpoint, {
                method,
                body,
                headers,
                ...customConfig,
                _retryCount: _retryCount + 1,
            });
        }

        // Final 401 after retries — redirect to login
        if (response.status === 401) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                const locale = window.location.pathname.startsWith("/ar") ? "ar" : "en";
                window.location.href = `/${locale}/login`;
            }
            throw new Error("Session expired. Please login again.");
        }

        throw new Error(data?.message || `API Error ${response.status}: ${response.statusText}`);
    } catch (error: any) {
        console.error(`[api-client] Fetch Error at ${endpoint}:`, error);
        return Promise.reject(error.message || error);
    }
}

export const api = {
    get: (endpoint: string, config = {}) => apiClient(endpoint, { ...config, method: "GET" }),
    post: (endpoint: string, body: any, config = {}) => apiClient(endpoint, { ...config, body, method: "POST" }),
    put: (endpoint: string, body: any, config = {}) => apiClient(endpoint, { ...config, body, method: "PUT" }),
    delete: (endpoint: string, config = {}) => apiClient(endpoint, { ...config, method: "DELETE" }),
};
