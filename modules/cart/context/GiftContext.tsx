"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useCart } from "../hooks/useCart";
import GiftModal from "@/components/GiftModal";
import toast from "react-hot-toast";
import { usePathname } from "next/navigation";

interface GiftItem {
    id: string;
    sku: string;
    name: string;
    image: string;
    qty_available: number;
    group_name: string;
}

interface GiftContextType {
    isGiftModalOpen: boolean;
    setIsGiftModalOpen: (open: boolean) => void;
    openGiftModal: () => void;
}

const GiftContext = createContext<GiftContextType | undefined>(undefined);

// Mock data for free gifts - Defined outside to avoid infinite re-renders
const AVAILABLE_GIFTS: GiftItem[] = [
    {
        id: "1",
        sku: "ADPE020W5012L",
        name: "ADNOC VOYAGER BRONZE 20W50 SL, 12X1L",
        image: "/logo/auttono-logo.jpg",
        qty_available: 2,
        group_name: "Free Items (2)"
    },
    {
        id: "2",
        sku: "ADPE010W3012L",
        name: "ADNOC VOYAGER SILVER 10W30 SN, 12X1L",
        image: "/logo/auttono-logo.jpg",
        qty_available: 2,
        group_name: "Free Items (2)"
    },
    {
        id: "3",
        sku: "ADPE015W4012L",
        name: "ADNOC VOYAGER BRONZE 15W40 SL, 12X1L",
        image: "/logo/auttono-logo.jpg",
        qty_available: 2,
        group_name: "Free Items (2)"
    },
    {
        id: "4",
        sku: "ADPE010W3012L-ALT",
        name: "ADNOC VOYAGER SILVER 10W30 SN, 12X1L",
        image: "/logo/auttono-logo.jpg",
        qty_available: 1,
        group_name: "Free Items (1)"
    },
    {
        id: "5",
        sku: "ADPE015W4012L-ALT",
        name: "ADNOC VOYAGER BRONZE 15W40 SL, 12X1L",
        image: "/logo/auttono-logo.jpg",
        qty_available: 1,
        group_name: "Free Items (1)"
    }
];

export function GiftProvider({ children }: { children: ReactNode }) {
    const { cart, addToCart } = useCart();
    const pathname = usePathname();
    const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
    const [hasSeenGiftModal, setHasSeenGiftModal] = useState(false);

    const openGiftModal = () => {
        setIsGiftModalOpen(true);
        setHasSeenGiftModal(true);
    };

    // Automatic trigger logic - Only trigger on the cart page
    useEffect(() => {
        const isCartPage = pathname?.endsWith("/cart") || pathname === "/cart";
        const totalUnits = cart?.items_count || 0;
        
        // Check if any gift item is already in the cart
        const giftSkus = AVAILABLE_GIFTS.map(g => g.sku);
        const hasGifts = cart?.items?.some(item => giftSkus.includes(item.sku));

        if (isCartPage && totalUnits >= 5 && !hasGifts && !hasSeenGiftModal) {
            setIsGiftModalOpen(true);
        }
    }, [cart?.items_count, cart?.items, hasSeenGiftModal, pathname]);

    const handleSelectGifts = async (selections: Record<string, number>) => {
        const giftItems = Object.entries(selections).filter(([_, qty]) => qty > 0);
        if (giftItems.length === 0) {
            setIsGiftModalOpen(false);
            setHasSeenGiftModal(true); // Don't show again if they explicitly chose nothing
            return;
        }

        const toastId = toast.loading("Adding your free gifts...");
        try {
            // Find the SKU for each selected gift ID
            for (const [id, qty] of giftItems) {
                const gift = AVAILABLE_GIFTS.find(g => g.id === id);
                if (gift) {
                    await addToCart(gift.sku, qty);
                }
            }

            toast.success("Free gifts added to your cart!", { id: toastId });
            setIsGiftModalOpen(false);
            setHasSeenGiftModal(true);
        } catch (err) {
            console.error("Failed to add gifts:", err);
            toast.error("Failed to add some gifts. Please try again.", { id: toastId });
        }
    };

    return (
        <GiftContext.Provider value={{ isGiftModalOpen, setIsGiftModalOpen, openGiftModal }}>
            {children}
            <GiftModal
                isOpen={isGiftModalOpen}
                onClose={() => setIsGiftModalOpen(false)}
                onSelectGifts={handleSelectGifts}
                maxGifts={3}
                availableGifts={AVAILABLE_GIFTS}
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
