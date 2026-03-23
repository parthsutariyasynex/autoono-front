import * as Types from "../constants/actionTypes";

const initialState = {
    data: null,
    loading: false,
    error: null,
};

export default (state = initialState, action: any) => {
    switch (action.type) {
        case Types.FETCH_CUSTOMER_SUCCESS:
            return {
                ...state,
                data: action.payload,
            };

        case Types.CLEAR_CUSTOMER:
            return {
                ...state,
                data: null,
            };

        default:
            return state;
    }
};
