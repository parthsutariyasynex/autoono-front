import * as Types from '../constants/actionTypes';
import { axiosGet, axiosPost, axiosPut, axiosDelete } from '../axiosHelper';

export const fetchAddresses = () => async (dispatch: any) => {
    dispatch({ type: Types.FETCH_ADDRESSES_REQUEST });
    axiosGet({
        url: '/addresses',
    }, (response) => {
        if (response.status === 200) {
            dispatch({ type: Types.FETCH_ADDRESSES_SUCCESS, payload: response.data });
        } else {
            dispatch({ type: Types.FETCH_ADDRESSES_FAILURE, payload: response.data?.message || "Failed to fetch addresses" });
        }
    });
};

export const addAddress = (addressData: any, cb?: (err: any) => void) => async (dispatch: any) => {
    axiosPost({
        url: '/addresses',
        reqBody: addressData,
    }, (response) => {
        if (response.status === 200) {
            dispatch({ type: Types.ADD_ADDRESS_SUCCESS, payload: response.data });
            dispatch(fetchAddresses());
            if (cb) cb(null);
        } else {
            if (cb) cb(response.data.message);
        }
    });
};

export const updateAddress = (addressId: number | string, addressData: any, cb?: (err: any) => void) => async (dispatch: any) => {
    axiosPut({
        url: `/addresses/${addressId}`,
        reqBody: addressData,
    }, (response) => {
        if (response.status === 200) {
            dispatch({ type: Types.UPDATE_ADDRESS_SUCCESS, payload: response.data });
            dispatch(fetchAddresses());
            if (cb) cb(null);
        } else {
            if (cb) cb(response.data.message);
        }
    });
};

export const deleteAddress = (addressId: number | string, cb?: (err: any) => void) => async (dispatch: any) => {
    axiosDelete({
        url: `/addresses/${addressId}`,
    }, (response) => {
        if (response.status === 200) {
            dispatch({ type: Types.DELETE_ADDRESS_SUCCESS, payload: addressId });
            dispatch(fetchAddresses());
            if (cb) cb(null);
        } else {
            if (cb) cb(response.data.message);
        }
    });
};

export const setDefaultAddress = ({ addressId, type }: { addressId: number | string; type: "billing" | "shipping" }, cb?: (err: any) => void) => async (dispatch: any, getState: any) => {
    try {
        const { address } = getState();
        const addressToUpdate = address.addresses.find((a: any) => String(a.id) === String(addressId));

        if (!addressToUpdate) {
            if (cb) cb("Address not found");
            return;
        }

        const updatedAddress = {
            ...addressToUpdate,
            default_billing: type === "billing" ? true : addressToUpdate.default_billing,
            default_shipping: type === "shipping" ? true : addressToUpdate.default_shipping,
        };

        axiosPut({
            url: `/addresses/${addressId}`,
            reqBody: { address: updatedAddress },
        }, (response) => {
            if (response.status === 200) {
                dispatch(fetchAddresses());
                if (cb) cb(null);
            } else {
                if (cb) cb(response.data.message);
            }
        });
    } catch (error: any) {
        if (cb) cb(error.message || "An error occurred");
    }
};
