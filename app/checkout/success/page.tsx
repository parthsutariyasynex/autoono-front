"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import React, { Suspense, useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Package, ArrowRight, Home, ShoppingBag } from "lucide-react";
import { useCheckout } from "@/modules/checkout/hooks/useCheckout";
import { toast } from "react-hot-toast";

const CheckoutSuccessPage = () => {
    return (
        <Suspense fallback={
            <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse space-y-6 text-center">
                <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto" />
                <div className="h-8 bg-gray-200 rounded w-2/3 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
                <div className="h-11 bg-gray-200 rounded-lg w-40 mx-auto" />
            </div>
        }>
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
    const [isPending, setIsPending] = useState(false);
    const hasFetchedRef = useRef(false);

    // Effect 1: Initial load — reads localStorage once, decides normal vs optimistic path.
    // Deps: [orderId] only — avoids re-running when lp/t/fetchCheckoutSuccess change
    // reference (they do on every render and would cause an infinite setState loop).
    useEffect(() => {
        if (!orderId) {
            router.push(lp("/"));
            return;
        }

        const savedData = localStorage.getItem('last_order_summary');
        let parsed: any = null;
        if (savedData) {
            try {
                parsed = JSON.parse(savedData);
                if (String(parsed.order_id) === String(orderId)) {
                    setOrderData(parsed);
                    setIsLoading(false);
                    if (parsed.status === "pending") {
                        setIsPending(true);
                        return; // Event listeners handled in Effect 2 below
                    }
                }
            } catch (e) {
                console.error("Error parsing saved order data", e);
            }
        }

        // Normal flow: fetch real order data from the API (once)
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;

        fetchCheckoutSuccess(orderId)
            .then(data => {
                setOrderData(data);
                localStorage.removeItem('last_order_summary');
            })
            .catch((error: any) => {
                console.error("Success Data Error:", error);
                if (!parsed) toast.error("Failed to load order details.");
            })
            .finally(() => setIsLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [orderId]);

    // Effect 2: Pending-order listeners — only active while isPending is true.
    // Listens for 'order-confirmed' / 'order-failed' events from CheckoutPage's
    // background placeOrder call, and polls localStorage as a fallback.
    useEffect(() => {
        if (!isPending) return;

        const onConfirmed = (e: Event) => {
            const { orderId: realId, orderIncrementId, result } = (e as CustomEvent).detail;
            setOrderData({
                order_id: realId,
                order_increment_id: orderIncrementId,
                grand_total: result?.grand_total,
                currency_code: result?.currency_code,
                status: result?.status,
            });
            setIsPending(false);
        };

        const onFailed = (e: Event) => {
            const { error } = (e as CustomEvent).detail;
            toast.error(error || "Failed to place order. Please try again.");
            router.push(lp("/checkout"));
        };

        window.addEventListener('order-confirmed', onConfirmed);
        window.addEventListener('order-failed', onFailed);

        // Polling fallback: catches the case where the event fired before this
        // effect mounted (placeOrder resolved very quickly).
        const pollId = setInterval(() => {
            try {
                const raw = localStorage.getItem('last_order_summary');
                if (!raw) return;
                const data = JSON.parse(raw);
                if (data.status !== "pending") {
                    setOrderData(data);
                    setIsPending(false);
                }
            } catch { }
        }, 1000);

        return () => {
            window.removeEventListener('order-confirmed', onConfirmed);
            window.removeEventListener('order-failed', onFailed);
            clearInterval(pollId);
        };
    }, [isPending, router, lp]);

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16 animate-pulse space-y-6 text-center">
                <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto" />
                <div className="h-8 bg-gray-200 rounded w-2/3 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto" />
                <div className="h-11 bg-gray-200 rounded-lg w-40 mx-auto" />
            </div>
        );
    }

    if (isPending) {
        return (
            <div className="bg-white min-h-screen font-sans flex flex-col items-center justify-center px-4 py-16 text-center">
                <div className="max-w-md mx-auto space-y-6">
                    <div className="flex justify-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h1 className="text-h2 font-bold text-black uppercase tracking-tight">
                        {t("checkoutSuccess.thankYou")}
                    </h1>
                    <p className="text-body-lg text-black/70">
                        {t("checkoutSuccess.orderConfirmation")}
                    </p>
                    <p className="text-body text-black/50">
                        Processing your order...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen font-sans flex flex-col">
            <main className="flex-grow flex flex-col items-center justify-center px-4 py-8 sm:py-12 md:py-20 text-center">
                <div className="max-w-2xl mx-auto space-y-4 sm:space-y-5 md:space-y-6">
                    <h1 className="text-h2 sm:text-h1-sm md:text-h1 lg:text-h1-lg font-bold text-black uppercase tracking-tight leading-tight">
                        {t("checkoutSuccess.thankYou")}
                    </h1>

                    <div className="space-y-2">
                        <p className="text-body-lg sm:text-h3-sm md:text-[18px] text-black">
                            {t("checkoutSuccess.orderNumber")} <span className="font-bold">{orderData?.order_increment_id || "..."}</span>.
                        </p>
                        <p className="text-body sm:text-body-lg md:text-h3-sm text-black/80 font-medium max-w-lg mx-auto leading-relaxed">
                            {t("checkoutSuccess.orderConfirmation")}
                        </p>
                    </div>

                    <div className="pt-4 sm:pt-6 md:pt-8">
                        <Link
                            href={lp("/products")}
                            className="inline-block w-full sm:w-auto px-6 sm:px-12 py-3 sm:py-3.5 bg-primary text-black text-body font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all shadow-sm rounded-sm"
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
