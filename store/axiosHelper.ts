import axios from "axios";
import store from "./store";

// Next.js API Proxy base URL (includes kleverapi prefix for consistency)
export const baseUrl = "/api/kleverapi";

function getLocale(): string {
    if (typeof window === "undefined") return "en";
    if (window.location.pathname.startsWith("/ar")) return "ar";
    // Fallback to cookie
    const match = document.cookie.match(/NEXT_LOCALE=([^;]+)/);
    return match?.[1] || "en";
}

function getResponse(response: any) {
    if (response && response.status === 401) {
        console.warn("[axiosHelper] 401 Unauthorized detected. Clearing token.");
        if (typeof window !== "undefined") {
            localStorage.removeItem("token");
        }
        _tokenCache = null;
    }

    if (response && response.data) {
        // Don't immediately redirect on 401 — let the caller handle retry
        return {
            status: response.status,
            data: response.data,
        };
    } else {
        return {
            status: 500,
            data: { message: "Internal Server Error" }
        };
    }
}

// Module-level token cache — avoids repeated localStorage/Redux reads and prevents
// the Redux-population re-render from triggering a second fetch cycle.
// TTL matches api-client.ts so both helpers stay in sync.
let _tokenCache: { token: string; fetchedAt: number } | null = null;
const TOKEN_CACHE_TTL = 55_000;

export function invalidateAxiosTokenCache(): void {
    _tokenCache = null;
    // Also clear any pending GET deduplications so post-logout calls start fresh
    _getInflight.clear();
}

export function getToken(): string | null {
    // Sub-account session override: use the sub-account token while impersonating
    if (typeof window !== "undefined" && localStorage.getItem("isSubAccount") === "true") {
        const subToken = localStorage.getItem("subAccountToken");
        if (subToken) return subToken;
    }

    // Return cached token if still fresh
    if (_tokenCache && Date.now() - _tokenCache.fetchedAt < TOKEN_CACHE_TTL) {
        return _tokenCache.token;
    }

    // localStorage FIRST — ProtectedLayout syncs the NextAuth token here on every
    // auth state change, so this is always current without a Redux store read.
    // Reading localStorage here avoids the Redux-population re-render triggering
    // a second axiosGet call because useSelector(token) changed from null → value.
    if (typeof window !== "undefined") {
        const lsToken = localStorage.getItem("token");
        if (lsToken) {
            _tokenCache = { token: lsToken, fetchedAt: Date.now() };
            return lsToken;
        }
    }

    // Redux fallback — covers edge cases where localStorage hasn't been written yet
    const reduxToken = store.getState().auth.token;
    if (reduxToken) {
        _tokenCache = { token: reduxToken, fetchedAt: Date.now() };
        return reduxToken;
    }

    return null;
}

// GET request inflight deduplicator — keyed by endpoint URL.
// When two callers fire axiosGet('/my-account', ...) at the same time (e.g. Navbar +
// page component both dispatching fetchCustomerInfo on mount), the second call attaches
// its callback to the already-in-flight request instead of firing a new HTTP request.
const _getInflight = new Map<string, Array<(res: any) => void>>();

export const axiosPost = (config: any, callback: (res: any) => void, progressCallback?: (progress: number) => void) => {
    const { url, reqBody, header } = config;
    const token = getToken();

    axios
        .post(url, reqBody, {
            headers: {
                ...header,
                Authorization: token ? `Bearer ${token}` : "",
                platform: "web",
                "x-locale": getLocale()
            },
            onUploadProgress: (progressEvent) => {
                if (progressEvent.total) {
                    const progress = (progressEvent.loaded / progressEvent.total) * 100;
                    if (typeof progressCallback === "function") {
                        progressCallback(Math.ceil(progress));
                    }
                }
            },
            baseURL: baseUrl,
        })
        .then((response) => {
            callback(getResponse(response));
        })
        .catch((err) => {
            callback(getResponse(err.response));
        });
};

export const axiosPut = (config: any, callback: (res: any) => void) => {
    const { url, reqBody, header } = config;
    const token = getToken();

    axios
        .put(url, reqBody, {
            headers: {
                ...header,
                Authorization: token ? `Bearer ${token}` : "",
                platform: "web",
                "x-locale": getLocale()
            },
            baseURL: baseUrl,
        })
        .then((response) => {
            callback(getResponse(response));
        })
        .catch((err) => {
            callback(getResponse(err.response));
        });
};

export const axiosDelete = (config: any, callback: (res: any) => void) => {
    const { url, header, reqBody } = config;
    const token = getToken();

    axios
        .delete(url, {
            data: reqBody,
            headers: {
                ...header,
                Authorization: token ? `Bearer ${token}` : "",
                platform: "web",
                "x-locale": getLocale()
            },
            baseURL: baseUrl,
        })
        .then((response) => {
            callback(getResponse(response));
        })
        .catch((err) => {
            callback(getResponse(err.response));
        });
};

export const axiosGet = (config: any, callback: (res: any) => void) => {
    const { url, header } = config;

    // Deduplicate concurrent GET calls for the same URL — a second call while the
    // first is in-flight just registers its callback; both receive the same response.
    if (_getInflight.has(url)) {
        _getInflight.get(url)!.push(callback);
        return;
    }

    const callbacks: Array<(res: any) => void> = [callback];
    _getInflight.set(url, callbacks);

    const token = getToken();

    axios
        .get(url, {
            headers: {
                ...header,
                Authorization: token ? `Bearer ${token}` : "",
                platform: "web",
                "x-locale": getLocale()
            },
            baseURL: baseUrl,
        })
        .then((response) => getResponse(response))
        .catch((err) => getResponse(err.response))
        .then((result) => {
            _getInflight.delete(url);
            callbacks.forEach(cb => cb(result));
        });
};
