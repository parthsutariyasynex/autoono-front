import * as Types from "../constants/actionTypes";

const initialState = {
    addresses: [],
    loading: false,
    error: null,
};

export default (state = initialState, action: any) => {
    switch (action.type) {
        case Types.FETCH_ADDRESSES_REQUEST:
            return {
                ...state,
                loading: true,
                error: null,
            };
        case Types.FETCH_ADDRESSES_SUCCESS:
            return {
                ...state,
                addresses: action.payload,
                loading: false,
            };
        case Types.FETCH_ADDRESSES_FAILURE:
            return {
                ...state,
                loading: false,
                error: action.payload,
            };

        case Types.ADD_ADDRESS_SUCCESS:
        case Types.UPDATE_ADDRESS_SUCCESS:
        case Types.DELETE_ADDRESS_SUCCESS:
            return {
                ...state,
                loading: false,
            };

        default:
            return state;
    }
};
