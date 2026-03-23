import * as Types from '../constants/actionTypes';
import { axiosPost, baseUrl } from '../axiosHelper';

export const login = (credentials: any, cb?: (err: any, data?: any) => void) => async (dispatch: any) => {
    dispatch({ type: Types.LOGIN_REQUEST });
    axiosPost({
        url: '/login',
        reqBody: {
            email: credentials.email,
            password: credentials.password,
        },
    }, (response) => {
        if (response.status === 200) {
            if (typeof window !== "undefined") {
                localStorage.setItem("token", response.data.token);
            }
            dispatch({ type: Types.LOGIN_SUCCESS, payload: response.data.token });
            if (cb) cb(null, response.data);
        } else {
            dispatch({ type: Types.LOGIN_FAILURE, payload: response.data.message });
            if (cb) cb(response.data.message);
        }
    });
};
export const sendOtp = (
    mobile: string,
    countryCode: string,
    cb?: (err: any, data?: any) => void
) => async (dispatch: any) => {

    console.log("--- DEBUG: SEND OTP START ---");
    console.log("Mobile:", mobile);
    console.log("Country Code:", countryCode);

    dispatch({ type: Types.SEND_OTP_REQUEST });

    try {
        const url = `/api/send-otp`;

        const payload = {
            mobile: mobile,
            countryCode: countryCode
        };

        console.log("Request URL:", url);
        console.log("Request Payload:", payload);

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                platform: "web"
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        console.log("Response Status:", response.status);
        console.log("Response Data:", data);

        if (response.ok) {
            dispatch({ type: Types.SEND_OTP_SUCCESS, payload: data });
            if (cb) cb(null, data);
        } else {
            dispatch({
                type: Types.SEND_OTP_FAILURE,
                payload: data.message || "Error sending OTP",
            });
            if (cb) cb(data.message || "Error sending OTP");
        }

    } catch (err: any) {
        console.error("Network/System Error:", err);

        dispatch({
            type: Types.SEND_OTP_FAILURE,
            payload: err.message,
        });

        if (cb) cb(err.message);
    }

    console.log("--- DEBUG: SEND OTP END ---");
};

export const loginWithOtp = (credentials: { mobile: string; otp: string; countryCode: string }, cb?: (err: any, data?: any) => void) => async (dispatch: any) => {
    console.log("--- DEBUG: LOGIN WITH OTP START ---");
    console.log("Input Credentials:", credentials);
    dispatch({ type: Types.LOGIN_REQUEST });

    try {
        const url = `/api/login-otp`;
        console.log("Attempting POST to:", url);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'platform': 'web'
            },
            body: JSON.stringify({
                mobile: credentials.mobile,
                otp: credentials.otp,
                countryCode: credentials.countryCode
            }),
        });

        const data = await response.json();
        console.log("API Status Code:", response.status);
        console.log("API Response Body:", data);

        if (response.ok) {
            // Check for token in different common locations
            const token = data.token || (data.customer && data.customer.token);

            if (token) {
                console.log("Success: Token received:", token);
                if (typeof window !== "undefined") {
                    localStorage.setItem("token", token);
                    console.log("Stored in localStorage: token =", localStorage.getItem("token"));
                }
                dispatch({ type: Types.LOGIN_SUCCESS, payload: token });
                console.log("Redux action Types.LOGIN_SUCCESS dispatched");
                if (cb) cb(null, data);
            } else {
                console.warn("API was 'ok' but NO TOKEN was found in response.");
                dispatch({ type: Types.LOGIN_FAILURE, payload: "No token returned from server" });
                if (cb) cb("No token returned from server");
            }
        } else {
            console.error("Verification Failed:", data.message || "Invalid OTP");
            dispatch({ type: Types.LOGIN_FAILURE, payload: data.message || "Invalid OTP" });
            if (cb) cb(data.message || "Invalid OTP");
        }
    } catch (err: any) {
        console.error("Critical Verification Error:", err);
        dispatch({ type: Types.LOGIN_FAILURE, payload: err.message });
        if (cb) cb(err.message);
    }
    console.log("--- DEBUG: LOGIN WITH OTP END ---");
};

export const forgotPassword = (email: string, cb?: (err: any, data?: any) => void) => async (dispatch: any) => {
    dispatch({ type: Types.FORGOT_PASSWORD_REQUEST });
    axiosPost({
        url: '/forgot-password',
        reqBody: { email },
    }, (response) => {
        if (response.status === 200) {
            dispatch({ type: Types.FORGOT_PASSWORD_SUCCESS });
            if (cb) cb(null, response.data);
        } else {
            dispatch({ type: Types.FORGOT_PASSWORD_FAILURE, payload: response.data.message });
            if (cb) cb(response.data.message);
        }
    });
};

export const logout = () => (dispatch: any) => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("token");
    }
    dispatch({ type: Types.LOGOUT });
};

export const changePassword = (credentials: any, cb?: (err: any, data?: any) => void) => async (dispatch: any) => {
    dispatch({ type: Types.CHANGE_PASSWORD_REQUEST });
    axiosPost({
        url: '/change-password',
        reqBody: credentials,
    }, (response) => {
        if (response.status === 200) {
            dispatch({ type: Types.CHANGE_PASSWORD_SUCCESS });
            if (cb) cb(null, response.data);
        } else {
            dispatch({ type: Types.CHANGE_PASSWORD_FAILURE, payload: response.data.message });
            if (cb) cb(response.data.message);
        }
    });
};
