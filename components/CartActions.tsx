"use client";

import React from "react";
import Link from "next/link";

interface CartActionsProps {
    itemsCount: number;
    onClearCart: () => void;
    onUpdateCart: () => void;
}

const CartActions: React.FC<CartActionsProps> = ({ itemsCount, onClearCart, onUpdateCart }) => {
    return (
        <div className="flex flex-col md:flex-row justify-between items-center bg-[#f2f2f2] border-x border-b border-gray-200 px-6 py-6 shadow-sm gap-4">
            <div className="flex flex-wrap items-center gap-3">
                <Link
                    href="/products"
                    className="px-6 py-3.5 bg-black text-white text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all duration-300 border border-black cursor-pointer"
                >
                    Continue Shopping
                </Link>
                <button
                    onClick={onClearCart}
                    className="px-6 py-3.5 bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all duration-300 border border-gray-300 cursor-pointer"
                >
                    Clear Cart
                </button>
                <button
                    onClick={onUpdateCart}
                    className="px-6 py-3.5 bg-[#f4b400] text-black text-[11px] font-black uppercase tracking-widest hover:bg-[#e0a500] transition-all duration-300 cursor-pointer"
                >
                    Update Shopping Cart
                </button>
            </div>

            <div className="flex items-center gap-4 ml-auto">
                <div className="flex flex-col items-end">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                        Cart Item
                    </span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                        Quantity
                    </span>
                </div>
                <span className="text-3xl font-black text-black leading-none">
                    {itemsCount}
                </span>
            </div>
        </div>
    );
};

export default CartActions;
