import axios from "axios";
import store from "./store";

// Next.js API Proxy base URL (includes kleverapi prefix for consistency)
export const baseUrl = "/api/kleverapi";

function getLocale(): string {
    if (typeof window === "undefined") return "en";
    return window.location.pathname.startsWith("/ar") ? "ar" : "en";
}

function getResponse(response: any) {
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

export function getToken() {
    // Try Redux first, then fallback to localStorage
    const reduxToken = store.getState().auth.token;
    if (reduxToken) return reduxToken;

    if (typeof window !== "undefined") {
        return localStorage.getItem("token");
    }
    return null;
}

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
        .then((response) => {
            callback(getResponse(response));
        })
        .catch((err) => {
            callback(getResponse(err.response));
        });
};
