import { getSession } from "next-auth/react";
import { LOCALE_COOKIE } from "@/lib/i18n/config";

const BASE_URL = "/api";
const MAX_AUTH_RETRIES = 3;
const AUTH_RETRY_DELAY = 800;

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

/**
 * Get auth token — tries NextAuth session first, falls back to localStorage.
 * If no token found, waits briefly and retries (handles post-login race condition).
 */
async function getAuthToken(attempt = 0): Promise<string | null> {
    // Try NextAuth session first
    try {
        const session: any = await getSession();
        if (session?.accessToken) {
            return session.accessToken;
        }
    } catch {
        // getSession() can fail in non-browser contexts
    }

    // Fallback: read from localStorage
    if (typeof window !== "undefined") {
        const localToken = localStorage.getItem("token");
        if (localToken) return localToken;
    }

    // No token found — wait and retry (session may still be initializing after login)
    if (attempt < 2) {
        await new Promise(r => setTimeout(r, 500));
        return getAuthToken(attempt + 1);
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
        config.headers.Authorization = `Bearer ${token.replace(/['"]/g, "").trim()}`;
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
