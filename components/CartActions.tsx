"use client";
import { useLocalePath } from "@/hooks/useLocalePath";

import React from "react";
import Link from "next/link";

interface CartActionsProps {
    itemsCount: number;
    onClearCart: () => void;
    onUpdateCart: () => void;
}

const CartActions: React.FC<CartActionsProps> = ({ itemsCount, onClearCart, onUpdateCart }) => {
    const lp = useLocalePath();
    return (
        <div className="flex flex-col md:flex-row justify-between items-center bg-gray-50/50 border border-gray-100 px-5 py-5 rounded-2xl gap-5">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                <Link
                    href={lp("/products")}
                    className="flex-1 md:flex-none px-4 py-2 bg-black text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-gray-800 transition-all cursor-pointer rounded-lg text-center active:scale-95 shadow-sm"
                >
                    Continue Shopping
                </Link>
                <button
                    onClick={onClearCart}
                    className="flex-1 md:flex-none px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] hover:bg-gray-50 transition-all border border-gray-100 cursor-pointer rounded-lg active:scale-95 shadow-sm"
                >
                    Clear Cart
                </button>
                <button
                    onClick={onUpdateCart}
                    className="flex-1 md:flex-none px-4 py-2 bg-[#FFC107] text-black text-[9px] font-black uppercase tracking-[0.2em] hover:bg-[#FFB300] transition-all cursor-pointer rounded-lg active:scale-95 shadow-md shadow-black/5"
                >
                    Update Cart
                </button>
            </div>

            <div className="flex items-center gap-4">
                <div className="text-right">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-0.5">
                        Total Items
                    </span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest block leading-none">
                        In Cart
                    </span>
                </div>
                <div className="w-10 h-10 bg-white border border-gray-100 rounded-lg flex items-center justify-center shadow-sm">
                    <span className="text-lg font-black text-black">
                        {itemsCount}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default CartActions;
