"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { getSession } from "next-auth/react";
import type { CartItem } from "@/modules/cart/context/CartContext";
import type {
    Warehouse,
    DistributionMap,
    MultiShippingAssignment,
    ItemValidation,
} from "../types";

async function getAuthToken(): Promise<string | null> {
    const session: any = await getSession();
    return session?.accessToken ?? null;
}

export function useMultiShipping() {
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [assignments, setAssignments] = useState<DistributionMap>({});
    const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ─── Fetch Warehouses (pickup stores) ───
    const fetchWarehouses = useCallback(async () => {
        try {
            setIsLoadingWarehouses(true);
            setError(null);
            const token = await getAuthToken();
            if (!token) return;

            const res = await fetch("/api/kleverapi/checkout/pickup-stores", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.ok) {
                const data = await res.json();
                const storesData = Array.isArray(data)
                    ? data
                    : data.stores || [];
                const mapped: Warehouse[] = storesData.map((s: any) => ({
                    id: s.id?.toString() || s.store_id?.toString() || "",
                    name: s.name || s.store_name || "",
                    address: s.address || "",
                    email: s.email || "",
                    gps_location: s.gps_location || "",
                }));
                setWarehouses(mapped);
            } else {
                throw new Error("Failed to fetch warehouses");
            }
        } catch (err: any) {
            setError(err.message || "Failed to load warehouses");
            console.error("Fetch Warehouses Error:", err);
        } finally {
            setIsLoadingWarehouses(false);
        }
    }, []);

    // ─── Initialize Assignments ───
    const initializeAssignments = useCallback(
        (items: CartItem[], warehouseList: Warehouse[]) => {
            // Only initialize if empty — don't overwrite user edits
            setAssignments((prev) => {
                if (Object.keys(prev).length > 0) return prev;
                const initial: DistributionMap = {};
                items.forEach((item) => {
                    initial[item.item_id] = {};
                    warehouseList.forEach((wh) => {
                        initial[item.item_id][wh.id] = 0;
                    });
                });
                return initial;
            });
        },
        []
    );

    // ─── Update Single Assignment ───
    const updateAssignment = useCallback(
        (itemId: number, warehouseId: string, value: string) => {
            const cleaned = value.replace(/[^0-9]/g, "");
            const numVal = Math.max(0, parseInt(cleaned) || 0);

            setAssignments((prev) => ({
                ...prev,
                [itemId]: {
                    ...(prev[itemId] || {}),
                    [warehouseId]: numVal,
                },
            }));
        },
        []
    );

    // ─── Per-Item Validation ───
    const getItemValidation = useCallback(
        (item: CartItem): ItemValidation => {
            const itemAssignments = assignments[item.item_id] || {};
            const totalAssigned = Object.values(itemAssignments).reduce(
                (sum, q) => sum + q,
                0
            );
            return {
                totalAssigned,
                cartQty: item.qty,
                isValid: totalAssigned === item.qty,
                remaining: item.qty - totalAssigned,
            };
        },
        [assignments]
    );

    // ─── Global Validation ───
    const validate = useCallback(
        (items: CartItem[]) => {
            if (!items || items.length === 0 || warehouses.length === 0) {
                return { isValid: false, errors: [] as string[] };
            }

            const errors: string[] = [];
            items.forEach((item) => {
                const v = getItemValidation(item);
                if (!v.isValid) {
                    if (v.remaining > 0) {
                        errors.push(
                            `"${item.name}" — ${v.remaining} unit(s) still unassigned (assigned ${v.totalAssigned} of ${v.cartQty})`
                        );
                    } else {
                        errors.push(
                            `"${item.name}" — over-assigned by ${Math.abs(v.remaining)} unit(s) (assigned ${v.totalAssigned} of ${v.cartQty})`
                        );
                    }
                }
            });

            return { isValid: errors.length === 0, errors };
        },
        [warehouses, getItemValidation]
    );

    // ─── Build Submission Payload ───
    const buildPayload = useCallback(
        (items: CartItem[]): MultiShippingAssignment[] => {
            return items.map((item) => ({
                item_id: item.item_id,
                sku: item.sku,
                name: item.name,
                cart_qty: item.qty,
                distributions: warehouses
                    .map((wh) => ({
                        warehouse_id: wh.id,
                        qty: assignments[item.item_id]?.[wh.id] ?? 0,
                    }))
                    .filter((d) => d.qty > 0),
            }));
        },
        [warehouses, assignments]
    );

    // ─── Submit Distribution ───
    const submitDistribution = useCallback(
        async (items: CartItem[]) => {
            try {
                setIsSubmitting(true);
                setError(null);
                const token = await getAuthToken();
                if (!token) throw new Error("Not authenticated");

                const payload = buildPayload(items);

                const res = await fetch(
                    "/api/kleverapi/checkout/multishipping/save-assignments",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`,
                        },
                        body: JSON.stringify({ assignments: payload }),
                    }
                );

                const data = await res.json();
                if (!res.ok) {
                    throw new Error(
                        data.message || "Failed to save distribution"
                    );
                }

                // Also persist to localStorage as fallback for checkout page
                localStorage.setItem(
                    "multi_shipping_assignments",
                    JSON.stringify(payload)
                );

                return data;
            } catch (err: any) {
                setError(err.message || "Failed to submit distribution");
                throw err;
            } finally {
                setIsSubmitting(false);
            }
        },
        [buildPayload]
    );

    return {
        warehouses,
        assignments,
        isLoadingWarehouses,
        isSubmitting,
        error,
        fetchWarehouses,
        initializeAssignments,
        updateAssignment,
        getItemValidation,
        validate,
        submitDistribution,
    };
}
