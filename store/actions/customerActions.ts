import * as Types from '../constants/actionTypes';
import { axiosGet } from '../axiosHelper';

export const fetchCustomerInfo = (cb?: (err: any, data?: any) => void) => async (dispatch: any) => {
    axiosGet({
        url: '/my-account',
    }, (response) => {
        if (response.status === 200) {
            dispatch({ type: Types.FETCH_CUSTOMER_SUCCESS, payload: response.data });
            if (cb) cb(null, response.data);
        } else {
            console.error("fetchCustomerInfo Error:", response.data?.message || "Unknown error", response.status);
            if (cb) cb(response.data.message);
        }
    });
};

export const clearCustomer = () => (dispatch: any) => {
    dispatch({ type: Types.CLEAR_CUSTOMER });
};
