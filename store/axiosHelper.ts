import axios from "axios";
import store from "./store";

// Next.js API Proxy base URL (includes kleverapi prefix for consistency)
export const baseUrl = "/api/kleverapi";

function getResponse(response: any) {
    if (response && response.data) {
        if (response.status === 401 || response.status === 403) {
            if (
                ["login", "verify-email", "register", "verify-mobile"]?.some((p) =>
                    window.location.pathname.indexOf(p) !== -1
                ) === false
            ) {
                window.location.href = "/login";
            }
        }
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
    return store.getState().auth.token;
}

export const axiosPost = (config: any, callback: (res: any) => void, progressCallback?: (progress: number) => void) => {
    const { url, reqBody, header } = config;
    const token = getToken();

    axios
        .post(url, reqBody, {
            headers: {
                ...header,
                Authorization: token ? `Bearer ${token}` : "",
                platform: "web"
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
                platform: "web"
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
                platform: "web"
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
                platform: "web"
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
