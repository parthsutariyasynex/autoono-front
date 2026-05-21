"use client";

import React from "react";
import CartItem from "./CartItem";
import CartSummary from "./CartSummary";
import CartActions from "./CartActions";
import Navbar from "@/app/components/Navbar";
import Link from "next/link";
import { ArrowRight, ShoppingBag, Gift, Pencil, CheckCircle2 } from "lucide-react";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useCheckout } from "@/modules/checkout/hooks/useCheckout";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";
import { useGift } from "@/modules/cart/context/GiftContext";

const CartPage: React.FC = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const { openGiftModal, availableGifts, hasGifts, isAllGiftsSelected } = useGift();
    const { cart, isLoading, error, removeFromCart, updateCartItem, clearCart, refetchCart } = useCart();
    // const { startMultiShipping } = useCheckout({ skipInitialFetch: true });
    const [pendingQtys, setPendingQtys] = React.useState<Record<number, number>>({});
    // const [isStartingMultiShipping, setIsStartingMultiShipping] = React.useState(false);
    const [isClearingCart, setIsClearingCart] = React.useState(false);

    // Always fetch fresh cart data when the cart page mounts
    React.useEffect(() => {
        refetchCart();
    }, []);


    const handleUpdateQty = (id: number, qty: number) => {
        setPendingQtys(prev => ({ ...prev, [id]: qty }));
    };

    const handleRemove = async (id: number) => {
        try {
            await removeFromCart(id);
            // Clear pending update for this item if any
            if (pendingQtys[id]) {
                const newPending = { ...pendingQtys };
                delete newPending[id];
                setPendingQtys(newPending);
            }
            toast.success(t("cart.itemRemoved"));
        } catch (err) {
            toast.error(t("cart.itemRemovalFailed"));
        }
    };

    const handleUpdateCart = async () => {
        const updateIds = Object.keys(pendingQtys);
        if (updateIds.length === 0) {
            await refetchCart();
            toast.success(t("cart.updated") || "Cart updated");
            return;
        }

        const toastId = toast.loading(t("cart.updating"));
        try {
            // Process all qty changes sequentially to avoid cart lock issues
            for (const id of updateIds) {
                await updateCartItem(Number(id), pendingQtys[Number(id)]);
            }
            setPendingQtys({});
            // Single refetch at the end to get accurate totals from server
            await refetchCart();
            toast.success(t("cart.updated") || "Cart updated", { id: toastId });
        } catch (err: any) {
            const msg = err instanceof Error ? err.message : "Failed to update cart";
            toast.error(msg, { id: toastId });
            // Refetch even on error so UI shows the real server state
            refetchCart();
        }
    };


    const handleClearCart = async () => {
        // if (!window.confirm(t("cart.confirmClear") || "Clear all items from your cart?")) return;
        const toastId = toast.loading(t("cart.clearing") || "Clearing cart...");
        setIsClearingCart(true);
        try {
            await clearCart();
            toast.success(t("cart.cartCleared") || "Cart cleared", { id: toastId });
        } catch (err: any) {
            const msg = err instanceof Error ? err.message : "Failed to clear cart";
            toast.error(msg, { id: toastId });
        } finally {
            setIsClearingCart(false);
        }
    };

    // const handleStartMultiShipping = async () => {
    //     if (!cart?.items || cart.items.length === 0) return;

    //     try {
    //         setIsStartingMultiShipping(true);
    //         await startMultiShipping();
    //     } catch (err: any) {
    //         // Magento may reject with "at least two units" — proceed anyway,
    //         // the assign step will handle the actual session setup
    //         console.warn("Multi-shipping start warning (proceeding):", err.message);
    //     }
    //     toast.success(t("cart.startingMultiLocation"));
    //     router.push(lp("/multi-location-delivery"));
    //     setIsStartingMultiShipping(false);
    // };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex items-center justify-between mb-6 animate-pulse">
                    <div className="h-7 bg-gray-200 rounded w-32" />
                    <div className="h-9 bg-gray-200 rounded w-28" />
                </div>
                <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 bg-white rounded-xl border border-gray-100 overflow-hidden">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex items-start gap-4 p-4 border-b border-gray-100 animate-pulse">
                                <div className="h-20 w-20 flex-shrink-0 rounded-lg bg-gray-200" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="h-8 bg-gray-200 rounded w-24" />
                                        <div className="h-5 bg-gray-200 rounded w-16" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="w-full lg:w-80 bg-white rounded-xl border border-gray-100 p-5 space-y-3 animate-pulse">
                        <div className="h-5 bg-gray-200 rounded w-32" />
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="flex justify-between">
                                <div className="h-4 bg-gray-200 rounded w-24" />
                                <div className="h-4 bg-gray-200 rounded w-16" />
                            </div>
                        ))}
                        <div className="h-px bg-gray-200 w-full" />
                        <div className="h-11 bg-gray-200 rounded-lg w-full mt-2" />
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-xl font-bold text-red-600 mb-2">{t("checkout.error")}</h2>
                <p className="text-black/60 mb-6">{error}</p>
                <button onClick={refetchCart} className="bg-black text-white px-6 py-2 rounded font-bold">{t("common.tryAgain")}</button>
            </div>
        );
    }

    const hasItems = cart && cart.items && cart.items.length > 0;

    if (!hasItems) {
        return (
            <div className="bg-white min-h-screen">
                <div className="w-full py-12 md:py-24 px-4 md:px-6 text-center">
                    <ShoppingBag size={64} className="mx-auto text-black/30 mb-6" />
                    <h1 className="text-xl md:text-2xl font-bold text-black uppercase tracking-widest mb-4">
                        {t("cart.noItems")}
                    </h1>
                    <Link href={lp("/products")} className="inline-flex items-center gap-2 text-primary font-bold hover:underline">
                        {t("cart.goToProducts")}
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surfaceOverlay pb-4 lg:pb-10">
            {/* Main Content Container */}
            <div className="w-full px-4 md:px-12 pt-8 md:pt-14">

                {/* Breadcrumbs & Title Section */}
                <div className="mb-10 md:mb-14 text-center">
                    <h1 className="text-xl md:text-2xl font-bold text-black uppercase tracking-tight mb-2">
                        {t("cart.title")}
                    </h1>
                    <div className="h-1 w-12 bg-primary mx-auto"></div>
                </div>

                {/* Free Gift Banner — always visible when gifts are available */}
                {availableGifts.length > 0 && (() => {
                    const selectedGiftNames = cart?.items
                        ?.filter(item => availableGifts.some(g => g.sku === item.sku))
                        .map(item => availableGifts.find(g => g.sku === item.sku)?.name)
                        .filter(Boolean) || [];

                    const messagePrefix = selectedGiftNames.length > 0
                        ? (selectedGiftNames.length > 1
                            ? `Free gifts ${selectedGiftNames.join(", ")} were added`
                            : `Free gift ${selectedGiftNames[0]} was added`)
                        : "Free Gift Added";

                    return (
                        <button
                            onClick={openGiftModal}
                            className={`w-full mb-8 active:scale-[0.99] transition-all duration-200 py-3.5 px-6 flex items-center justify-center gap-3 cursor-pointer ${hasGifts
                                ? "bg-white border-2 border-[#008a00] hover:bg-green-50"
                                : "bg-[#008a00] hover:bg-[#006e00]"
                                }`}
                        >
                            {hasGifts ? (
                                <>
                                    <Gift size={18} className="text-[#008a00]" />
                                    <span className="text-[#008a00] font-bold text-[15px] tracking-wide">
                                        {messagePrefix} {" "}
                                        {/* <span className="underline decoration-dashed underline-offset-4 font-bold">
                                            <span className="hidden sm:inline">Free Gifts</span>
                                        </span> */}
                                    </span>
                                    {/* <Pencil size={14} className="text-[#008a00]" /> */}
                                </>
                            ) : (
                                <>
                                    <Gift size={18} className="text-white" />
                                    <span className="text-white font-bold text-[15px] tracking-wide">
                                        Select your{" "}
                                        <span className="underline decoration-dashed underline-offset-4 font-bold">
                                            FREE GIFT
                                        </span>

                                    </span>
                                </>
                            )}
                        </button>
                    );
                })()}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16 items-start">

                    {/* Left Column (Items & Actions) */}
                    <div className="lg:col-span-8 xl:col-span-9 flex flex-col min-w-0">

                        <div className="flex flex-col h-full">
                            {/* Table Header (Sticky Top) */}
                            <div className="hidden lg:flex sticky top-0 z-20 bg-white border border-gray-100 rounded-xl items-center py-4 px-10 mb-4 shadow-sm">
                                <div className="w-[45%] text-caption font-bold text-black uppercase tracking-widest">{t("cart.itemDescription")}</div>
                                <div className="w-[15%] text-caption font-bold text-black uppercase tracking-widest text-center">{t("cart.price")}</div>
                                <div className="w-[20%] text-caption font-bold text-black uppercase tracking-widest text-center">{t("cart.qty")}</div>
                                <div className="w-[20%] text-caption font-bold text-black uppercase tracking-widest text-right">{t("cart.total")}</div>
                            </div>

                            {/* Scrollable Items Container */}
                            <div className="flex-1 custom-scrollbar pr-2 space-y-4 pb-4">
                                {cart.items.map((item) => (
                                    <CartItem
                                        key={item.item_id}
                                        item={item}
                                        currencyCode={cart.currency_code}
                                        onUpdateQty={handleUpdateQty}
                                        onRemove={handleRemove}
                                    />
                                ))}
                            </div>

                            {/* Actions Bar */}
                            <div className="mt-6">
                                <div className="space-y-4">
                                    <CartActions
                                        itemsCount={cart.items_count}
                                        onClearCart={handleClearCart}
                                        onUpdateCart={handleUpdateCart}
                                        isClearingCart={isClearingCart}
                                    />

                                    {/* Multiple Address Section Bar */}
                                    {/* <div className="border border-primary bg-white rounded-xl flex flex-col md:flex-row items-stretch justify-between overflow-hidden shadow-xl shadow-primary/5">
                                        <div className="px-6 py-4 flex items-center bg-gray-50/50 flex-1">
                                            <h4 className="text-caption font-bold text-black uppercase tracking-wider">{t("cart.multiAddressShipping")}</h4>
                                        </div>
                                        <button
                                            onClick={handleStartMultiShipping}
                                            disabled={isStartingMultiShipping}
                                            className="bg-primary font-bold py-4 px-10 uppercase tracking-widest text-caption hover:bg-black hover:text-white transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed w-full md:w-auto shadow-none"
                                        >
                                            <span className={isStartingMultiShipping ? "animate-pulse opacity-60" : ""}>
                                                {t("cart.shipToMultiple")}
                                            </span>
                                        </button>
                                    </div> */}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Summary): lg:col-span-4 or 3 */}
                    <div className="lg:col-span-4 xl:col-span-3 z-10 w-full">
                        <CartSummary
                            subtotal={cart.subtotal}
                            taxAmount={cart.tax_amount}
                            taxLabel={cart.tax_label}
                            grandTotal={cart.grand_total}
                            currencyCode={cart.currency_code}
                            discountAmount={cart.discount_amount}
                        />
                    </div>
                </div>
            </div>


            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #f9fafb;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                    border: 2px solid #f9fafb;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #d1d5db;
                }
            `}</style>
        </div>
    );
};

export default CartPage;
