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
        <div className="bg-white border border-gray-100 rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* Header */}
            <div className="bg-[#f8f8f8] px-6 py-4 border-b border-gray-100">
                <h2 className="text-[11px] font-black text-black uppercase tracking-[0.25em]">
                    {t("m.order-summary")}
                </h2>
            </div>

            <div className="p-6 md:p-8 space-y-8">
                {/* Price Breakdown */}
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-black font-black text-[10px] uppercase tracking-widest">{t("cart.subtotal")}</span>
                        <span className="font-black text-black text-sm">
                            <Price amount={subtotal} />
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-black font-black text-[10px] uppercase tracking-widest">
                            {taxLabel || t("m.tax")}
                        </span>
                        <span className="font-black text-black text-sm">
                            <Price amount={taxAmount} />
                        </span>
                    </div>
                </div>

                {/* Total Section - ALWAYS ABOVE COUPON CODE AS REQUESTED */}
                <div className="pt-6 border-t border-gray-100">
                    <div className="flex justify-between items-end">
                        <span className="text-black font-black text-[11px] uppercase tracking-widest mb-2">{t("common.grandTotal")}</span>
                        <div className="text-right">
                            <Price
                                amount={grandTotal}
                                symbolClassName="text-lg mr-1 relative top-[-2px] text-black font-black"
                                className="font-black text-black text-3xl tracking-tighter"
                            />
                        </div>
                    </div>
                </div>

                {/* Discount Code */}
                <div className="pt-8 border-t border-gray-100 flex flex-col gap-4">
                    <label className="text-black font-black text-[10px] uppercase tracking-widest">{t("m.coupon-code")}</label>
                    <div className="flex gap-2 h-[48px]">
                        <input
                            type="text"
                            placeholder={t("m.enter-discount-code") || "Enter discount code"}
                            className="flex-1 px-4 text-[12px] font-black text-black bg-white border border-gray-200 rounded-sm focus:border-black focus:outline-none transition-all placeholder:text-gray-300 placeholder:font-medium"
                        />
                        <button className="px-8 bg-black text-white text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all cursor-pointer rounded-sm shadow-lg flex items-center justify-center shrink-0">
                            {t("m.apply")}
                        </button>
                    </div>
                </div>

                {/* Checkout Button */}
                <div className="pt-4">
                    <button
                        onClick={() => router.push(lp("/checkout"))}
                        className="w-full py-5 bg-[#f5b21a] text-black text-[11px] font-black uppercase tracking-[0.25em] hover:bg-black hover:text-white active:scale-[0.98] transition-all duration-300 shadow-xl shadow-yellow-400/10 rounded-sm flex items-center justify-center gap-2"
                    >
                        {t("m.checkout")} »
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartSummary;
