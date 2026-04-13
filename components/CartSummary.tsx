"use client";
import { useLocalePath } from "@/hooks/useLocalePath";
import { useTranslation } from "@/hooks/useTranslation";

import React from "react";
import { useRouter } from "next/navigation";
import Price from "@/app/components/Price";

interface CartSummaryProps {
    subtotal: number;
    taxAmount: number;
    taxLabel: string;
    grandTotal: number;
    currencyCode: string;
}

const CartSummary: React.FC<CartSummaryProps> = ({ subtotal, taxAmount, taxLabel, grandTotal, currencyCode }) => {
    const router = useRouter();
    const lp = useLocalePath();
    const { t } = useTranslation();

    return (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-xl shadow-gray-200/50 overflow-hidden">
            {/* Header */}
            <div className="bg-gray-50/50 px-5 py-3.5 border-b border-gray-100">
                <h2 className="text-[10px] font-black text-black uppercase tracking-[0.2em] flex items-center gap-2">
                    {t("m.order-summary")}
                </h2>
            </div>

            <div className="p-6 space-y-7">
                {/* Price Breakdown */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-black font-bold text-[9px] uppercase tracking-widest">{t("cart.subtotal")}</span>
                        <span className="font-black text-black text-xs">
                            <Price amount={subtotal} />
                        </span>
                    </div>

                    <div className="flex justify-between items-center pb-2">
                        <span className="text-black font-bold text-[9px] uppercase tracking-widest">
                            {taxLabel || t("m.tax")}
                        </span>
                        <span className="font-black text-black text-xs">
                            <Price amount={taxAmount} />
                        </span>
                    </div>
                </div>

                <div className="border-t border-gray-50 pt-2"></div>

                {/* Total Section - MOVED ABOVE COUPON CODE */}
                <div className="pt-2">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-black font-bold text-[10px] uppercase tracking-widest mb-1.5">{t("common.grandTotal")}</span>
                        <div className="text-right">
                            <Price amount={grandTotal} symbolClassName="text-lg mr-1.5 relative top-[-1px]" className="font-black text-black text-2xl tracking-tighter" />
                        </div>
                    </div>
                </div>

                {/* Discount Code */}
                <div className="pt-6 border-t border-gray-50 flex flex-col gap-3">
                    <label className="text-black font-black text-[10px] uppercase tracking-widest">{t("m.coupon-code")}</label>
                    <div className="flex gap-2 h-11">
                        <input
                            type="text"
                            placeholder={t("m.enter-discount-code") || "Enter discount code"}
                            className="flex-1 w-full px-4 text-[11px] font-bold text-black bg-gray-50/50 border border-gray-100 rounded-2xl focus:bg-white focus:border-yellow-400 focus:outline-none transition-all placeholder:text-gray-300"
                        />
                        <button className="px-6 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all cursor-pointer rounded-2xl shadow-lg flex items-center justify-center shrink-0">
                            {t("m.apply")}
                        </button>
                    </div>
                </div>

                {/* Checkout Button */}
                <div className="pt-4">
                    <button
                        onClick={() => router.push(lp("/checkout"))}
                        className="w-full py-4.5 bg-[#FFC107] text-black text-[11px] font-black uppercase tracking-[0.2em] hover:bg-black hover:text-white active:scale-95 transition-all duration-300 shadow-xl shadow-yellow-400/20 rounded-2xl flex items-center justify-center gap-2"
                    >
                        {t("m.checkout")} »
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartSummary;
