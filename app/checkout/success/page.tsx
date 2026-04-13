"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Home, ShoppingBag, Loader2 } from "lucide-react";
import { useCheckout } from "@/modules/checkout/hooks/useCheckout";
import { toast } from "react-hot-toast";

const CheckoutSuccessPage = () => {
    return (
        <Suspense fallback={<div className="flex-1 flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#f5a623]"></div></div>}>
            <CheckoutSuccessContent />
        </Suspense>
    );
};

const CheckoutSuccessContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const orderId = searchParams.get("order_id");
    const { fetchCheckoutSuccess } = useCheckout({ skipInitialFetch: true });
    const [orderData, setOrderData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (!orderId || hasFetched) {
            if (!orderId) router.push(lp("/"));
            return;
        }

        // Try to load from localStorage first for instant display
        const savedData = localStorage.getItem('last_order_summary');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (String(parsed.order_id) === String(orderId)) {
                    setOrderData(parsed);
                    setIsLoading(false);
                }
            } catch (e) {
                console.error("Error parsing saved order data", e);
            }
        }

        const getSuccessData = async () => {
            setHasFetched(true);
            try {
                const data = await fetchCheckoutSuccess(orderId);
                setOrderData(data);
                localStorage.removeItem('last_order_summary');
            } catch (error: any) {
                console.error("Success Data Error:", error);
                if (!orderData) toast.error(t("orderDetails.failedLoadDetails"));
            } finally {
                setIsLoading(false);
            }
        };

        getSuccessData();
    }, [orderId, fetchCheckoutSuccess, router, hasFetched, orderData]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f9f9f9]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#F5B21B] rounded-full animate-spin" />
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest italic">{t("checkoutSuccess.verifyingOrder")}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen font-sans flex flex-col">


            <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 sm:py-12 md:py-20 text-center">
                <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
                    <h1 className="text-[24px] sm:text-[28px] md:text-[32px] lg:text-[42px] font-black text-black uppercase tracking-tight leading-tight">
                        {t("checkoutSuccess.thankYou")}
                    </h1>

                    <div className="space-y-2">
                        <p className="text-[14px] sm:text-[16px] md:text-[18px] text-black">
                            {t("checkoutSuccess.orderNumber")} <span className="font-bold">{orderData?.order_increment_id || "..."}</span>.
                        </p>
                        <p className="text-[13px] sm:text-[14px] md:text-[16px] text-[#555] font-medium max-w-lg mx-auto leading-relaxed">
                            {t("checkoutSuccess.orderConfirmation")}
                        </p>
                    </div>

                    <div className="pt-4 sm:pt-6 md:pt-8">
                        <Link
                            href={lp("/products")}
                            className="inline-block w-full sm:w-auto px-6 sm:px-12 py-3 sm:py-3.5 bg-[#F5B21B] text-black text-[13px] font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all shadow-sm rounded-sm"
                        >
                            {t("checkoutSuccess.continueShopping")}
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default CheckoutSuccessPage;
