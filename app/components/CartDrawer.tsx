"use client";

import { X, Trash2, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useCart } from "@/modules/cart/hooks/useCart";
import Link from "next/link";
import { formatPrice } from "@/utils/helpers";
import Price from "./Price";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";


interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { cart, isLoading, updateCartItem, removeFromCart, refetchCart } = useCart();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const [isAnimating, setIsAnimating] = useState(false);

    // Sync with cart-updated events
    useEffect(() => {
        const handleCartUpdate = () => refetchCart();
        window.addEventListener("cart-updated", handleCartUpdate);
        return () => window.removeEventListener("cart-updated", handleCartUpdate);
    }, [refetchCart]);

    useEffect(() => {
        if (isOpen) {
            setIsAnimating(true);
            // Don't disable scroll for a dropdown-style cart, only for full drawers
            // document.body.style.overflow = "hidden"; 
        } else {
            const timer = setTimeout(() => setIsAnimating(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isOpen && !isAnimating) return null;

    return (
        <div className={`fixed inset-0 z-[100] transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            {/* Overlay - allows clicking outside to close */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
                onClick={onClose}
            />

            {/* Dropdown Panel */}
            <div
                className={`absolute right-0 sm:right-4 top-0 sm:top-20 w-full sm:w-[350px] h-full sm:h-auto bg-white sm:rounded-xl shadow-2xl flex flex-col transition-all duration-300 ease-in-out transform ${isOpen
                    ? "translate-x-0 sm:translate-y-0 opacity-100 sm:scale-100"
                    : "translate-x-full sm:translate-x-0 sm:-translate-y-4 opacity-0 sm:scale-95 pointer-events-none"
                    } overflow-hidden sm:max-h-[calc(100vh-120px)]`}
            >
                {/* Top Section */}
                <div className="p-4 border-b border-gray-100">
                    <div className="flex justify-between items-center">
                        <h2 className="text-[15px] sm:text-[17px] font-bold text-gray-900">
                            {cart?.items_count || 0} {t("cart.itemsInCart")}
                        </h2>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors -mr-1"
                            aria-label="Close cart"
                        >
                            <X size={22} className="text-gray-500" />
                        </button>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                        <div className="text-right ml-auto">
                            <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{t("cart.subtotal")}</p>
                            <p className="text-[15px] sm:text-[17px] font-black text-[#003d7e] price currency-riyal">

                                <Price amount={cart?.subtotal || 0} />

                            </p>
                        </div>
                    </div>
                </div>

                {/* Cart Product List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar min-h-[100px] sm:max-h-[450px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-3">
                            <div className="w-8 h-8 border-3 border-[#f5b21a] border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-xs text-gray-400 font-medium">{t("cart.updatingCart")}</p>
                        </div>
                    ) : (cart?.items?.length || 0) === 0 ? (
                        <div className="text-center py-12 px-6">
                            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <ShoppingCartIcon />
                            </div>
                            <p className="text-gray-500 font-bold">{t("cart.yourCartIsEmpty")}</p>
                            <p className="text-xs text-gray-400 mt-1">{t("cart.addItems")}</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {cart?.items.map((item) => (
                                <div key={item.item_id} className="p-4 flex gap-4 hover:bg-gray-50/50 transition-colors group relative">
                                    {/* Left: Product Image */}
                                    <div className="w-20 h-20 bg-white border border-gray-100 rounded-lg flex-shrink-0 p-1 flex items-center justify-center group-hover:border-[#f5b21a]/30 transition-colors">
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
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2">
                                                {item.name}
                                            </h3>
                                            <p className="text-[15px] font-black text-[#003d7e] mt-1 price currency-riyal">

                                                <Price amount={item.price} />

                                            </p>
                                        </div>

                                        {/* Quantity Selector */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[11px] font-bold text-gray-400 uppercase">{t("cart.qty")}:</span>
                                            <div className="flex items-center bg-gray-100 rounded-md p-0.5 border border-gray-200">
                                                <button
                                                    onClick={() => updateCartItem(item.item_id, item.qty - 1)}
                                                    className="w-6 h-6 flex items-center justify-center hover:bg-white hover:shadow-sm rounded transition-all text-gray-600"
                                                    disabled={item.qty <= 1}
                                                >
                                                    <Minus size={12} strokeWidth={3} />
                                                </button>
                                                <input
                                                    type="text"
                                                    value={item.qty}
                                                    readOnly
                                                    className="w-8 text-center text-xs font-bold text-gray-900 bg-transparent"
                                                />
                                                <button
                                                    onClick={() => updateCartItem(item.item_id, item.qty + 1)}
                                                    className="w-6 h-6 flex items-center justify-center hover:bg-white hover:shadow-sm rounded transition-all text-gray-600"
                                                >
                                                    <Plus size={12} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Delete Icon */}
                                    <button
                                        onClick={() => removeFromCart(item.item_id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors self-start mt-1"
                                        aria-label="Remove item"
                                    >
                                        <Trash2 size={18} strokeWidth={2.5} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom Section */}
                <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0">
                    <Link
                        href={lp("/cart")}
                        onClick={onClose}
                        className="w-full h-[48px] sm:h-[55px] bg-[#f5b21a] hover:bg-[#e0a218] text-black font-black rounded-lg transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl uppercase tracking-widest text-[12px] sm:text-sm"
                    >
                        {t("cart.viewAndEditCart")}
                    </Link>
                </div>
            </div>


        </div>
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
