import { getSession } from "next-auth/react";

const BASE_URL = "/api";

async function apiClient(
    endpoint: string,
    { method = "GET", body, headers = {}, ...customConfig }: any = {}
) {
    // Get token from NextAuth session first, then fall back to localStorage
    let token: string | null = null;
    try {
        const session: any = await getSession();
        token = session?.accessToken || null;
    } catch {
        // getSession() can fail in non-browser contexts
    }

    // Fallback: read from localStorage (set by Redux login)
    if (!token && typeof window !== "undefined") {
        token = localStorage.getItem("token");
    }

    const isFormData = body instanceof FormData;

    const config: any = {
        method,
        ...customConfig,
        headers: {
            ...(!isFormData && { "Content-Type": "application/json" }),
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
        const data = await response.json();

        if (response.ok) {
            return data;
        }

        // Handle expired/invalid token — redirect to login
        if (response.status === 401) {
            if (typeof window !== "undefined") {
                localStorage.removeItem("token");
                window.location.href = "/login";
            }
            throw new Error("Session expired. Please login again.");
        }

        throw new Error(data.message || "Something went wrong");
    } catch (error: any) {
        return Promise.reject(error.message);
    }
}

export const api = {
    get: (endpoint: string, config = {}) => apiClient(endpoint, { ...config, method: "GET" }),
    post: (endpoint: string, body: any, config = {}) => apiClient(endpoint, { ...config, body, method: "POST" }),
    put: (endpoint: string, body: any, config = {}) => apiClient(endpoint, { ...config, body, method: "PUT" }),
    delete: (endpoint: string, config = {}) => apiClient(endpoint, { ...config, method: "DELETE" }),
};
