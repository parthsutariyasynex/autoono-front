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
        <div className="lg:sticky lg:top-28 self-start bg-white border border-gray-100 rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* Header */}
            <div className="bg-[#fcfcfc] px-6 py-4 border-b border-gray-100">
                <h2 className="text-[11px] font-bold text-gray-900 uppercase tracking-[0.2em]">
                    {t("m.order-summary")}
                </h2>
            </div>

            <div className="p-4 md:p-6 lg:p-8 space-y-7">
                {/* Price Breakdown */}
                <div className="space-y-3.5">
                    <div className="flex justify-between items-center">
                        <span className="text-black font-medium text-[10px] uppercase tracking-wider">{t("cart.subtotal")}</span>
                        <span className="font-semibold text-gray-900 text-[13px]">
                            <Price amount={subtotal} />
                        </span>
                    </div>

                    <div className="flex justify-between items-center">
                        <span className="text-black font-medium text-[10px] uppercase tracking-wider">
                            {taxLabel || t("m.tax")}
                        </span>
                        <span className="font-semibold text-gray-900 text-[13px]">
                            <Price amount={taxAmount} />
                        </span>
                    </div>
                </div>

                {/* Total Section */}
                <div className="pt-5 border-t border-gray-100">
                    <div className="flex justify-between items-center">
                        <span className="text-black font-bold text-[10px] uppercase tracking-tight">{t("common.grandTotal")}</span>
                        <div className="text-right">
                            <Price
                                amount={grandTotal}
                                symbolClassName="text-xs mr-1 font-bold text-gray-900"
                                className="font-bold text-black text-[12px] tracking-tight"
                            />
                        </div>
                    </div>
                </div>

                {/* Discount Code */}
                <div className="pt-6 border-t border-gray-100 flex flex-col gap-2">
                    <label className="text-black font-bold text-[10px] uppercase tracking-wider">{t("m.coupon-code")}</label>
                    <div className="flex gap-2 items-stretch h-[46px]">
                        <input
                            type="text"
                            placeholder={t("m.enter-discount-code") || "Enter discount code"}
                            className="flex-1 min-w-0 px-4 text-sm font-medium text-black bg-white border border-gray-200 rounded focus:border-black focus:outline-none transition-all placeholder:text-gray-300 placeholder:font-normal"
                        />
                        <button className="px-6 bg-black text-white text-xs font-semibold uppercase tracking-wider hover:bg-gray-800 transition-all cursor-pointer rounded flex items-center justify-center shrink-0">
                            {t("m.apply")}
                        </button>
                    </div>
                </div>

                {/* Checkout Button — hidden on mobile (mobile uses fixed bottom overlay in CartPage) */}
                <div className="pt-2 hidden lg:block">
                    <button
                        onClick={() => router.push(lp("/checkout"))}
                        className="w-full py-4.5 bg-[#f5b21a] text-black text-[12px] font-bold uppercase tracking-[0.2em] hover:bg-black hover:text-white active:scale-[0.98] transition-all duration-300 shadow-md rounded flex items-center justify-center gap-2"
                    >
                        {t("cart.proceedCheckout")} »
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartSummary;
