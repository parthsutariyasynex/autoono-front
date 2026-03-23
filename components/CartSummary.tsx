"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface CartSummaryProps {
    subtotal: number;
    taxAmount: number;
    taxLabel: string;
    grandTotal: number;
    currencyCode: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ subtotal, taxAmount, taxLabel, grandTotal, currencyCode }) => {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6">
            {/* ... Summary Section ... */}
            <div className="bg-[#f2f2f2] border-b border-gray-100">
                <div className="bg-[#e6e6e6] py-3.5 border-b border-gray-200">
                    <h2 className="text-[15px] font-black text-black text-center uppercase tracking-wider">
                        Summary
                    </h2>
                </div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-black font-black text-[14px] uppercase tracking-tight">Item(s) Total:</span>
                        <span className="font-bold text-gray-800 text-[15px]">
                            ﷼ {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-black font-black text-[14px] uppercase tracking-tight">
                            VAT (15%):
                        </span>
                        <span className="font-bold text-gray-800 text-[15px]">
                            ﷼ {taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-black font-black text-[16px]">Grand Total</span>
                        <span className="font-black text-black text-[18px]">
                            ﷼ {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Discount Codes Section */}
            <div className="bg-[#f2f2f2] border-b border-gray-100">
                <div className="bg-[#e6e6e6] py-3.5 border-b border-gray-200">
                    <h2 className="text-[15px] font-black text-black text-center uppercase tracking-wider">
                        Discount Codes
                    </h2>
                </div>
                <div className="p-6">
                    <div className="flex h-[45px]">
                        <input
                            type="text"
                            placeholder="Enter Your discount code"
                            className="flex-1 px-4 text-sm text-gray-500 bg-white border border-gray-300 border-r-0 focus:border-gray-400 focus:outline-none cursor-text transition-colors"
                        />
                        <button className="bg-black text-white px-8 text-[12px] font-black uppercase tracking-widest hover:bg-gray-800 active:scale-95 transition-all cursor-pointer flex-shrink-0">
                            Apply
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <button
                onClick={() => router.push("/checkout")}
                className="w-full py-5 bg-[#f4b400] text-black text-[16px] font-black uppercase tracking-tight hover:bg-black hover:text-white active:scale-[0.98] transition-all duration-300 shadow-lg shadow-yellow-400/10 cursor-pointer rounded-sm"
            >
                Proceed to Checkout
            </button>
        </div>
    );
};

export default CartSummary;
