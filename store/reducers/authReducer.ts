import * as Types from "../constants/actionTypes";

const initialState = {
    token: null,
    loading: false,
    error: null,
};

export default (state = initialState, action: any) => {
    switch (action.type) {
        case Types.LOGIN_REQUEST:
        case Types.SEND_OTP_REQUEST:
        case Types.FORGOT_PASSWORD_REQUEST:
        case Types.CHANGE_PASSWORD_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };

        case Types.LOGIN_SUCCESS:
            return {
                ...state,
                loading: false,
                token: action.payload,
            };

        case Types.LOGIN_FAILURE:
        case Types.SEND_OTP_FAILURE:
        case Types.FORGOT_PASSWORD_FAILURE:
        case Types.CHANGE_PASSWORD_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        case Types.SEND_OTP_SUCCESS:
        case Types.FORGOT_PASSWORD_SUCCESS:
        case Types.CHANGE_PASSWORD_SUCCESS:
            return {
                ...state,
                loading: false,
            };

        case Types.LOGOUT:
            return {
                ...state,
                token: null,
                loading: false,
            };

        default:
            return state;
    }
};
