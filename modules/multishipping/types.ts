export interface Warehouse {
    id: string;
    name: string;
    address: string;
    email: string;
    gps_location: string;
}

/**
 * assignments[itemId][warehouseId] = quantity
 * Example: { 101: { "wh-1": 4, "wh-2": 6 }, 102: { "wh-1": 10, "wh-2": 0 } }
 */
export type DistributionMap = Record<number, Record<string, number>>;

export interface MultiShippingAssignment {
    item_id: number;
    sku: string;
    name: string;
    cart_qty: number;
    distributions: {
        warehouse_id: string;
        qty: number;
    }[];
}

export interface SubmitDistributionPayload {
    assignments: MultiShippingAssignment[];
}

export interface SubmitDistributionResponse {
    success: boolean;
    message: string;
    redirect_url?: string;
}

export interface ItemValidation {
    totalAssigned: number;
    cartQty: number;
    isValid: boolean;
    remaining: number;
}
