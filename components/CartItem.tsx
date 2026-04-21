"use client";

import React, { useState } from "react";
import { X, Minus, Plus, Loader2 } from "lucide-react";
import Link from "next/link";
import { CartItem as CartItemType } from "@/modules/cart/hooks/useCart";
import Price from "@/app/components/Price";


import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";

interface CartItemProps {
    item: CartItemType;
    currencyCode: string;
    onUpdateQty: (id: number, qty: number) => void;
    onRemove: (id: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, currencyCode, onUpdateQty, onRemove }) => {
    const { t } = useTranslation();
    const [localQty, setLocalQty] = useState(item.qty);

    const handleQtyChange = (newQty: number) => {
        if (newQty < 1) return;
        setLocalQty(newQty);
        onUpdateQty(item.item_id, newQty);
    };

    // Update local state if the prop changes (e.g. after a successful batch update)
    React.useEffect(() => {
        setLocalQty(item.qty);
    }, [item.qty]);


    return (
        <div className="relative bg-white border border-gray-100 rounded-3xl p-4 lg:p-6 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-500 group/item">
            {/* Remove Button */}
            <button
                onClick={() => {
                    onRemove(item.item_id);
                    toast.success(t("cart.itemRemoved"), {
                        style: {
                            borderRadius: '12px',
                            background: '#fffafaff',
                            color: '#000',
                            fontSize: '9px',
                            fontWeight: 'black',
                            textTransform: 'uppercase',
                        },
                    });
                }}
                className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center bg-gray-50 text-gray-400 rounded-full transition-all z-10 cursor-pointer hover:bg-[#FF4444] hover:text-white hover:scale-110 active:scale-95 opacity-0 group-hover/item:opacity-100 shadow-sm border border-gray-100"
                title={t("m.remove-item")}
            >
                <X size={10} strokeWidth={4} />
            </button>

            {/* Mobile Layout */}
            <div className="lg:hidden">
                <div className="flex gap-4">
                    <div className="w-20 h-20 bg-white border border-gray-100 p-2 flex items-center justify-center rounded-xl shadow-sm">
                        <img src={item.image_url || "/images/tyre-sample.png"} alt={item.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                        <span className="text-caption font-black text-primary uppercase tracking-widest mb-1 block">{t("quickOrder.title")}</span>
                        <h3 className="text-sm font-black text-gray-900 leading-tight uppercase tracking-tight line-clamp-2">{item.name}</h3>
                        <div className="flex flex-wrap gap-2 mt-3">
                            {item.size_display && (
                                <div className="text-caption font-bold text-gray-500 bg-gray-50 border border-gray-100 px-2 py-1 rounded-lg">
                                    {item.size_display}
                                </div>
                            )}
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-base font-black text-black">
                                <Price amount={item.price} />
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center justify-between mt-4 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                    <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <button
                            onClick={() => handleQtyChange(localQty - 1)}
                            disabled={localQty <= 1}
                            className="w-8 h-8 flex items-center justify-center hover:bg-primary font-bold transition-all disabled:opacity-20"
                        >
                            <Minus size={12} strokeWidth={3} />
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center text-xs font-black text-black">
                            {localQty}
                        </span>
                        <button
                            onClick={() => handleQtyChange(localQty + 1)}
                            className="w-8 h-8 flex items-center justify-center hover:bg-primary font-bold transition-all disabled:opacity-20"
                        >
                            <Plus size={12} strokeWidth={3} />
                        </button>
                    </div>

                    <div className="text-right">
                        <span className="text-sm font-black text-black">
                            <Price amount={item.row_total} />
                        </span>
                    </div>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:flex items-center">
                {/* Product: Image + Name (45%) */}
                <div className="w-[45%] flex items-center gap-4">
                    <div className="w-16 xl:w-20 h-16 xl:h-20 bg-white border border-gray-100 p-1.5 flex items-center justify-center rounded-xl shadow-sm group-hover/item:shadow-md transition-all flex-shrink-0">
                        <img
                            src={item.image_url || "/images/tyre-sample.png"}
                            alt={item.name}
                            className="max-w-full max-h-full object-contain transition-transform duration-700 group-hover/item:scale-110"
                        />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xs xl:text-sm font-black text-gray-900 leading-tight uppercase tracking-tight mb-2 transition-colors group-hover/item:text-black line-clamp-1">{item.name}</h3>
                        <div className="flex flex-wrap gap-1.5 single-line-attributes">
                            {item.size_display && (
                                <span className="text-micro font-black text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md uppercase">
                                    {t("m.size")}: {item.size_display}
                                </span>
                            )}
                            {item.pattern_display && (
                                <span className="text-micro font-black text-gray-400 bg-gray-50 border border-gray-100 px-1.5 py-0.5 rounded-md uppercase">
                                    {t("m.pattern")}: {item.pattern_display}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Price (15%) */}
                <div className="w-[15%] text-center">
                    <span className="text-xs xl:text-sm font-black text-gray-900">
                        <Price amount={item.price} />
                    </span>
                </div>

                {/* Qty (20%) */}
                <div className="w-[20%] flex justify-center items-center">
                    <div className="flex items-center border border-gray-100 bg-white rounded-lg shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-primary transition-all">
                        <button
                            onClick={() => handleQtyChange(localQty - 1)}
                            disabled={localQty <= 1}
                            className="w-7 h-7 flex items-center justify-center hover:bg-primary text-black transition-all disabled:opacity-20 active:scale-95"
                        >
                            <Minus size={11} strokeWidth={3} />
                        </button>
                        <div className="w-8 h-7 flex items-center justify-center border-x border-gray-50">
                            <span className="text-xs font-black text-gray-900">{localQty}</span>
                        </div>
                        <button
                            onClick={() => handleQtyChange(localQty + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-primary text-black transition-all disabled:opacity-20 active:scale-95"
                        >
                            <Plus size={11} strokeWidth={3} />
                        </button>
                    </div>

                </div>

                {/* Total (20%) */}
                <div className="w-[20%] text-right pr-4">
                    <span className="text-sm xl:text-base font-black text-black">
                        <Price amount={item.row_total} />
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CartItem;
