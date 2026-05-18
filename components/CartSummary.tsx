"use client";
import { useLocalePath } from "@/hooks/useLocalePath";
import { useTranslation } from "@/hooks/useTranslation";

import React from "react";
import { useRouter } from "next/navigation";
import Price from "@/app/components/Price";
import { useGift } from "@/modules/cart/context/GiftContext";

interface CartSummaryProps {
    subtotal: number;
    taxAmount: number;
    taxLabel: string;
    grandTotal: number;
    currencyCode: string;
    discountAmount?: number;
}

const CartSummary: React.FC<CartSummaryProps> = ({ subtotal, taxAmount, taxLabel, grandTotal, currencyCode, discountAmount }) => {
    const router = useRouter();
    const lp = useLocalePath();
    const { t, isRtl } = useTranslation();
    const { availableGifts, openGiftModal, hasGifts } = useGift();

    const hasDiscount = !!discountAmount && discountAmount > 0;

    return (
        <div className="lg:sticky lg:top-28 self-start bg-white border border-gray-100 rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.05)] overflow-hidden">
            {/* Header */}
            <div className="bg-gray-200 px-6 py-4 border-b border-gray-200 flex items-center justify-center">
                <h2 className="text-[18px] font-[900] text-black uppercase tracking-tight">
                    {t("orderDetails.orderSummary") === "ORDER SUMMARY" ? "SUMMARY" : (t("orderDetails.orderSummary") || "SUMMARY")}
                </h2>
            </div>

            <div className="px-6 py-5 space-y-0">
                {/* Price Breakdown */}
                <div className="space-y-3 pb-4 border-b border-gray-100">
                    {/* Items Total */}
                    <div className="flex justify-between items-center">
                        <span className="text-[13px] font-[900] text-black uppercase tracking-tight">
                            {t("multi.itemsTotal") || "ITEM(S) TOTAL:"}
                        </span>
                        <span className="text-[13px] font-[900] text-black">
                            <Price amount={subtotal} />
                        </span>
                    </div>

                    {/* Discount — only shown when items have a discount applied */}
                    {!!discountAmount && discountAmount > 0 && (
                        <div className="flex justify-between items-center">
                            <span className="text-[#008a00] font-[900] text-caption uppercase tracking-tight">
                                {t("m.discount") || "DISCOUNT"}
                            </span>
                            <span className="font-[900] text-[#008a00] text-body-sm">
                                - <Price amount={discountAmount} />
                            </span>
                        </div>
                    )}

                    {/* {!hasGifts && availableGifts.length > 0 && (
                        // <div
                        //     onClick={openGiftModal}
                        //     className="flex justify-between items-center p-3 bg-[#008a00]/5 border border-dashed border-[#008a00] rounded-lg cursor-pointer hover:bg-[#008a00]/10 transition-all group animate-pulse hover:animate-none"
                        // >
                        //     <span className="text-[#008a00] font-[900] text-caption uppercase tracking-tight">
                        //         {t("m.free-gift-available") || "FREE GIFT AVAILABLE"}
                        //     </span>
                        //     <span className="font-[900] text-[#008a00] text-xs underline uppercase group-hover:no-underline">
                        //         {t("m.select-now") || "SELECT NOW"}
                        //     </span>
                        // </div>
                    )} */}

                    {/* VAT */}
                    <div className="flex justify-between items-center">
                        <span className="text-[13px] font-[900] text-black uppercase tracking-tight">
                            {isRtl ? t("m.tax") : (taxLabel?.toUpperCase().includes("VAT") ? taxLabel : "SAUDI VAT 15%")}
                        </span>
                        <span className="text-[13px] font-[900] text-black">
                            <Price amount={taxAmount} />
                        </span>
                    </div>
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center pt-4">
                    <span className="text-[14px] font-[900] text-black uppercase tracking-tight">
                        {t("common.grandTotal") || "GRAND TOTAL"}
                    </span>
                    <span className="text-[14px] font-[900] text-black">
                        <Price amount={grandTotal} />
                    </span>
                </div>

                {/* Coupon Code */}
                <div className="pt-5 border-t border-gray-100 flex flex-col gap-2 mt-4">
                    <label className="text-[11px] font-[900] text-black uppercase tracking-widest">
                        {t("m.coupon-code") || "Coupon Code"}
                    </label>
                    <div className="flex gap-2 items-stretch h-[44px]">
                        <input
                            type="text"
                            placeholder={t("m.enter-discount-code") || "Enter discount code"}
                            className="flex-1 min-w-0 px-4 text-sm font-medium text-black bg-white border border-gray-200 rounded focus:border-black focus:outline-none transition-all placeholder:text-black/40 placeholder:font-normal"
                        />
                        <button className="px-5 bg-black text-white text-xs font-[900] uppercase tracking-wider hover:bg-gray-800 transition-all cursor-pointer rounded flex items-center justify-center shrink-0">
                            {t("m.apply") || "Apply"}
                        </button>
                    </div>
                </div>

                {/* Checkout Button */}
                <div className="pt-4">
                    <button
                        onClick={() => router.push(lp("/checkout"))}
                        className="w-full py-4 bg-primary text-[13px] font-[900] uppercase tracking-[0.2em] hover:bg-black hover:text-white active:scale-[0.98] transition-all duration-300 shadow-md rounded flex items-center justify-center gap-2"
                    >
                        {t("cart.proceedCheckout") || "PROCEED TO CHECKOUT"} »
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartSummary;
