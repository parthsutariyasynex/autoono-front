import { getSession } from "next-auth/react";

const BASE_URL = "/api";

async function apiClient(
    endpoint: string,
    { method = "GET", body, headers = {}, ...customConfig }: any = {}
) {
    // Get session for token
    const session: any = await getSession();
    const token = session?.accessToken;

    const config = {
        method,
        ...customConfig,
        headers: {
            "Content-Type": "application/json",
            ...headers,
        },
    };

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (response.ok) {
            return data;
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
