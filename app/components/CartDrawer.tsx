"use client";

import { X, Trash2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/modules/cart/hooks/useCart";
import Link from "next/link";
import { formatPrice } from "@/utils/helpers";
import Price from "./Price";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";


import Drawer from "./Drawer";
import Popup from "./Popup";
import toast from "react-hot-toast";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { cart, isLoading, updateCartItem, removeFromCart, refetchCart } = useCart();
    const { t } = useTranslation();
    const lp = useLocalePath();

    // Confirmation State
    const [confirmId, setConfirmId] = useState<number | null>(null);
    const [isRemoving, setIsRemoving] = useState(false);

    // Sync with cart-updated events
    useEffect(() => {
        const handleCartUpdate = () => refetchCart();
        window.addEventListener("cart-updated", handleCartUpdate);
        return () => window.removeEventListener("cart-updated", handleCartUpdate);
    }, [refetchCart]);

    const handleConfirmDelete = async () => {
        if (!confirmId) return;
        setIsRemoving(true);
        try {
            await removeFromCart(confirmId);
            toast.success(t("cart.itemRemoved"));
            setConfirmId(null);
        } catch (error) {
            toast.error(t("cart.error"));
        } finally {
            setIsRemoving(false);
        }
    };

    const itemToDelete = cart?.items.find(i => i.item_id === confirmId);

    return (
        <>
            <Drawer
                isOpen={isOpen}
                onClose={onClose}
                title={`${cart?.items_count || 0} ${t("cart.itemsInCart")}`}
            >
                <div className="flex flex-col h-full bg-white">
                    {/* Header Sub-info */}
                    <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
                        <div className="flex justify-between items-center">
                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest leading-none">
                                {t("cart.subtotal")}
                            </span>
                            <span className="text-[17px] font-black text-black price currency-riyal">
                                <Price amount={cart?.subtotal || 0} />
                            </span>
                        </div>
                    </div>

                    {/* Cart Product List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                                <div className="w-10 h-10 border-3 border-[#f5b21a] border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-xs text-gray-400 font-black uppercase tracking-widest">{t("cart.updatingCart")}</p>
                            </div>
                        ) : (cart?.items?.length || 0) === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 px-10 text-center">
                                <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                    <ShoppingCartIcon />
                                </div>
                                <p className="text-[16px] font-black text-gray-900 uppercase tracking-tight">{t("cart.yourCartIsEmpty")}</p>
                                <p className="text-xs text-gray-400 mt-2 font-medium">{t("cart.addItems")}</p>
                                <button
                                    onClick={onClose}
                                    className="mt-8 text-[11px] font-black text-[#f5b21a] uppercase tracking-[0.2em] hover:text-black transition-colors"
                                >
                                    {t("multi.continueShopping")}
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 pb-20">
                                {cart?.items.map((item) => (
                                    <div key={item.item_id} className="p-6 flex gap-6 hover:bg-gray-50/30 transition-all group">
                                        {/* Left: Product Image */}
                                        <div className="w-24 h-24 bg-white border border-gray-100 rounded-lg flex-shrink-0 p-2 flex items-center justify-center shadow-sm group-hover:shadow-md transition-all duration-300">
                                            <img
                                                src={item.image_url || "/images/tyre-sample.png"}
                                                alt={item.name}
                                                className="max-w-full max-h-full object-contain"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "/images/tyre-sample.png";
                                                }}
                                            />
                                        </div>

                                        {/* Center: Info */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <div>
                                                <h3 className="text-sm font-black text-gray-900 leading-snug line-clamp-2 uppercase tracking-tight">
                                                    {item.name}
                                                </h3>
                                                <p className="text-[16px] font-black text-black mt-1.5 price currency-riyal">
                                                    <Price amount={item.price} />
                                                </p>
                                            </div>

                                            {/* Quantity & Actions */}
                                            <div className="flex items-center justify-between mt-4">
                                                <div className="flex items-center bg-gray-100 rounded-md p-0.5 border border-gray-200">
                                                    <button
                                                        onClick={() => updateCartItem(item.item_id, item.qty - 1)}
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded transition-all text-gray-600 disabled:opacity-30"
                                                        disabled={item.qty <= 1}
                                                    >
                                                        <Minus size={12} strokeWidth={3} />
                                                    </button>
                                                    <span className="w-10 text-center text-xs font-black text-gray-900 bg-transparent">
                                                        {item.qty}
                                                    </span>
                                                    <button
                                                        onClick={() => updateCartItem(item.item_id, item.qty + 1)}
                                                        className="w-7 h-7 flex items-center justify-center hover:bg-white hover:shadow-sm rounded transition-all text-gray-600"
                                                    >
                                                        <Plus size={12} strokeWidth={3} />
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => setConfirmId(item.item_id)}
                                                    className="w-9 h-9 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                    aria-label="Remove item"
                                                >
                                                    <Trash2 size={18} strokeWidth={2.5} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Bottom Section */}
                    <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] z-10">
                        <Link
                            href={lp("/cart")}
                            onClick={onClose}
                            className="w-full h-[55px] bg-[#f5b21a] hover:bg-black text-black hover:text-white font-black rounded-sm transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl uppercase tracking-[0.2em] text-[12px]"
                        >
                            {t("cart.viewAndEditCart")}
                        </Link>
                    </div>
                </div>
            </Drawer>

            <Popup
                isOpen={!!confirmId}
                onClose={() => setConfirmId(null)}
                animation="fade-scale"
                maxWidth="max-w-[550px]"
                className="!rounded-[4px] shadow-2xl"
            >
                <div className="bg-white relative">
                    {/* Close Button */}
                    <button
                        onClick={() => setConfirmId(null)}
                        className="absolute top-4 right-4 w-7 h-7 bg-black rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform z-10"
                    >
                        <X size={14} strokeWidth={3} />
                    </button>

                    <div className="p-8 pb-6">
                        <p className="text-gray-900 text-[15px] font-medium leading-relaxed mt-2">
                            {t("cart.confirmRemove")}
                        </p>
                    </div>

                    <div className="border-t border-gray-100 p-6 pt-5 pb-5 flex justify-end gap-3 bg-white">
                        <button
                            onClick={() => setConfirmId(null)}
                            className="px-8 py-2.5 bg-black text-white font-black uppercase tracking-widest text-[12px] hover:bg-gray-900 transition-all rounded-sm min-w-[120px]"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            onClick={handleConfirmDelete}
                            disabled={isRemoving}
                            className="px-10 py-2.5 bg-[#fdb913] text-black font-black uppercase tracking-widest text-[12px] hover:bg-[#e5a811] transition-all rounded-sm min-w-[100px] flex items-center justify-center gap-2"
                        >
                            {isRemoving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : t("common.ok")}
                        </button>
                    </div>
                </div>
            </Popup>
        </>
    );
}

function ShoppingCartIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
    );
}
