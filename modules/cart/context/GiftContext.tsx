"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useCart } from "../hooks/useCart";
import GiftModal from "@/components/GiftModal";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";
import { getSession } from "next-auth/react";

export interface GiftItem {
    id: string;
    sku: string;
    name: string;
    image: string;
    qty_available: number;
    group_name: string;
    rule_id: number;
}

interface GiftContextType {
    isGiftModalOpen: boolean;
    setIsGiftModalOpen: (open: boolean) => void;
    openGiftModal: () => void;
}

const GiftContext = createContext<GiftContextType | undefined>(undefined);

async function getAuthToken(): Promise<string | null> {
    const session = await getSession();
    return (session as any)?.accessToken || null;
}

/** Parse the promo_rules array from the discount-popup response into GiftItems */
function parsePromoRules(promoRules: any[]): { gifts: GiftItem[]; maxQty: number } {
    const gifts: GiftItem[] = [];
    let maxQty = 0;

    for (const rule of promoRules) {
        const ruleId: number = rule.rule_id ?? rule.id ?? 0;
        const ruleName: string = rule.name ?? rule.label ?? `Rule ${ruleId}`;
        const ruleMaxQty: number = rule.max_qty ?? rule.qty ?? rule.common_qty ?? 1;
        maxQty += ruleMaxQty;

        const items: any[] = rule.items ?? rule.products ?? rule.gift_items ?? [];
        for (const item of items) {
            gifts.push({
                id: `${ruleId}_${item.sku}`,
                sku: item.sku,
                name: item.name ?? item.sku,
                image: item.image_url ?? item.image ?? item.thumbnail ?? "/logo/auttono-logo.jpg",
                qty_available: item.qty_available ?? item.stock_qty ?? ruleMaxQty,
                group_name: `${ruleName} (${ruleMaxQty})`,
                rule_id: ruleId,
            });
        }
    }

    return { gifts, maxQty: maxQty || 3 };
}

export function GiftProvider({ children }: { children: ReactNode }) {
    const { cart, refetchCart } = useCart();
    const pathname = usePathname();

    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [hasSeenGiftModal, setHasSeenGiftModal] = useState(false);
    const [availableGifts, setAvailableGifts] = useState<GiftItem[]>([]);
    const [maxGifts, setMaxGifts] = useState(3);

    const openGiftModal = () => {
        setIsGiftModalOpen(true);
        setHasSeenGiftModal(true);
    };

    /** Fetch gift options from discount-popup API */
    const fetchDiscountPopup = useCallback(async () => {
        const token = await getAuthToken();
        if (!token) return;

        try {
            const res = await fetch("/api/kleverapi/cart/discount-popup", {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) return;

            const data = await res.json();
            const promoRules: any[] = data.promo_rules ?? [];

            if (promoRules.length === 0) {
                setAvailableGifts([]);
                return;
            }

            const { gifts, maxQty } = parsePromoRules(promoRules);
            setAvailableGifts(gifts);
            setMaxGifts(maxQty);

            // Auto-open if the API says so
            if (data.auto_open_popup && !hasSeenGiftModal) {
                setIsGiftModalOpen(true);
            }
        } catch (err) {
            console.error("[GiftContext] fetchDiscountPopup error:", err);
        }
    }, [hasSeenGiftModal]);

    // Fetch gift options when cart changes (items added/removed)
    useEffect(() => {
        if (cart?.items_count && cart.items_count > 0) {
            fetchDiscountPopup();
        } else {
            setAvailableGifts([]);
        }
    }, [cart?.items_count, fetchDiscountPopup]);

    // Auto-open on cart page when conditions are met
    useEffect(() => {
        const isCartPage = pathname?.endsWith("/cart") || pathname === "/cart";
        const totalUnits = cart?.items_count || 0;

        const giftSkus = availableGifts.map(g => g.sku);
        const hasGifts = cart?.items?.some(item => giftSkus.includes(item.sku));

        if (isCartPage && totalUnits >= 5 && availableGifts.length > 0 && !hasGifts && !hasSeenGiftModal) {
            setIsGiftModalOpen(true);
        }
    }, [cart?.items_count, cart?.items, availableGifts, hasSeenGiftModal, pathname]);

    const handleSelectGifts = async (selections: Record<string, number>) => {
        const selectedEntries = Object.entries(selections).filter(([_, qty]) => qty > 0);
        if (selectedEntries.length === 0) {
            setIsGiftModalOpen(false);
            setHasSeenGiftModal(true);
            return;
        }

        const token = await getAuthToken();
        if (!token) {
            toast.error("Please log in to add gifts.");
            return;
        }

        const toastId = toast.loading("Adding your free gifts...");

        // Build batch payload: [{ sku, rule_id, qty }]
        const items = selectedEntries
            .map(([id, qty]) => {
                const gift = availableGifts.find(g => g.id === id);
                if (!gift) return null;
                return { sku: gift.sku, rule_id: gift.rule_id, qty };
            })
            .filter(Boolean);

        try {
            const res = await fetch("/api/kleverapi/cart/promo-items/add", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ items }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.message || "Failed to add gifts.", { id: toastId });
            } else {
                toast.success("Free gifts added to your cart!", { id: toastId });
                await refetchCart();
                window.dispatchEvent(new Event("cart-updated"));
            }
        } catch (err) {
            console.error("[GiftContext] handleSelectGifts error:", err);
            toast.error("Failed to add gifts. Please try again.", { id: toastId });
        }

        setIsGiftModalOpen(false);
        setHasSeenGiftModal(true);
    };

    return (
        <GiftContext.Provider value={{ isGiftModalOpen, setIsGiftModalOpen, openGiftModal }}>
            {children}
            <GiftModal
                isOpen={isGiftModalOpen}
                onClose={() => setIsGiftModalOpen(false)}
                onSelectGifts={handleSelectGifts}
                maxGifts={maxGifts}
                availableGifts={availableGifts}
            />
        </GiftContext.Provider>
    );
}

export function useGift() {
    const context = useContext(GiftContext);
    if (context === undefined) {
        throw new Error("useGift must be used within a GiftProvider");
    }
    return context;
}
