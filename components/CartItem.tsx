"use client";

import React, { useState } from "react";
import { X, Minus, Plus } from "lucide-react";
import Link from "next/link";
import { CartItem as CartItemType } from "@/modules/cart/hooks/useCart";

interface CartItemProps {
    item: CartItemType;
    currencyCode: string;
    onUpdateQty: (id: number, qty: number) => void;
    onRemove: (id: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ item, currencyCode, onUpdateQty, onRemove }) => {
    const [updating, setUpdating] = useState(false);

    const handleQtyChange = async (newQty: number) => {
        if (newQty < 1 || updating) return;
        setUpdating(true);
        try {
            await onUpdateQty(item.item_id, newQty);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="relative bg-white border-x border-b border-gray-200 hover:bg-gray-50/50 transition-all duration-300 group/item hover:shadow-inner">
            {/* Remove Button - Top Right Circular */}
            <button
                onClick={() => {
                    if (window.confirm("Are you sure you want to remove this product?")) {
                        onRemove(item.item_id);
                    }
                }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-gray-100/80 hover:bg-red-500 text-gray-400 hover:text-white rounded-full transition-all z-10 opacity-0 group-hover/item:opacity-100 cursor-pointer shadow-sm hover:scale-110 active:scale-95"
                title="Remove item"
            >
                <X size={14} />
            </button>

            <div className="flex flex-col md:flex-row items-center py-8 px-6 gap-6 md:gap-0">
                {/* Product Image */}
                <div className="w-full md:w-1/6 flex justify-center overflow-hidden">
                    <div className="w-28 h-28 bg-white border border-gray-100 p-2 flex items-center justify-center shadow-sm group-hover/item:shadow-md transition-all duration-500 rounded-sm">
                        <img
                            src={item.image_url || "/images/tyre-sample.png"}
                            alt={item.name}
                            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover/item:scale-110"
                        />
                    </div>
                </div>

                {/* Product Name & Details */}
                <div className="w-full md:w-2/6 px-6 text-center md:text-left">
                    <Link href={item.product_url || "#"} className="hover:text-yellow-600 transition-colors cursor-pointer inline-block">
                        <h3 className="text-[15px] font-black text-black leading-tight mb-2 uppercase tracking-wide group-hover/item:text-yellow-600 transition-colors">
                            {item.name}
                        </h3>
                    </Link>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                        {item.size_display && (
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase group-hover/item:bg-white border border-transparent group-hover/item:border-gray-200 transition-all">
                                Size: {item.size_display}
                            </span>
                        )}
                        {item.pattern_display && (
                            <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase group-hover/item:bg-white border border-transparent group-hover/item:border-gray-200 transition-all">
                                Pattern: {item.pattern_display}
                            </span>
                        )}
                    </div>
                </div>

                {/* Price Column */}
                <div className="w-full md:w-1/6 text-center md:ml-4">
                    <span className="text-xs text-gray-400 font-bold uppercase md:hidden mr-2">Price:</span>
                    <span className="text-[15px] font-black text-gray-900 tracking-tight">
                        ﷼ {item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>

                {/* Qty Column */}
                <div className="w-full md:w-1/6 flex justify-center items-center md:-ml-2">
                    <span className="text-xs text-gray-400 font-bold uppercase md:hidden mr-4">Qty:</span>
                    <div className="flex items-center border-2 border-gray-100 p-1 bg-white focus-within:border-yellow-400 transition-all duration-300">
                        <button
                            onClick={() => handleQtyChange(item.qty - 1)}
                            disabled={item.qty <= 1 || updating}
                            className="w-8 h-8 flex items-center justify-center hover:bg-yellow-400 text-black transition-all disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed active:scale-90"
                        >
                            <Minus size={14} strokeWidth={3} />
                        </button>
                        <span className="w-10 h-8 flex items-center justify-center text-[13px] font-black text-black cursor-default">
                            {updating ? (
                                <span className="w-3 h-3 border-2 border-gray-200 border-t-yellow-400 rounded-full animate-spin" />
                            ) : (
                                item.qty
                            )}
                        </span>
                        <button
                            onClick={() => handleQtyChange(item.qty + 1)}
                            disabled={updating}
                            className="w-8 h-8 flex items-center justify-center hover:bg-yellow-400 text-black transition-all disabled:opacity-20 cursor-pointer disabled:cursor-not-allowed active:scale-90"
                        >
                            <Plus size={14} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Total Column */}
                <div className="w-full md:w-1/6 text-center md:-mr-4">
                    <span className="text-xs text-gray-400 font-bold uppercase md:hidden mr-2">Total:</span>
                    <span className="text-[16px] font-black text-black tracking-tight">
                        ﷼ {item.row_total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CartItem;
