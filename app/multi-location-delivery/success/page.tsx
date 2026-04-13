"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useCheckout } from "@/modules/checkout/hooks/useCheckout";

interface OrderRow {
    order_id: string;
    order_increment_id: string;
    shipping_address: string;
}

const MultiShippingSuccessPage = () => {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-gray-100 border-t-[#f5b21a] rounded-full animate-spin" />
            </div>
        }>
            <MultiShippingSuccessContent />
        </Suspense>
    );
};

const MultiShippingSuccessContent = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const orderId = searchParams.get("order_id"); // comma-separated entity_ids like "28675,28676,28677"
    const { fetchMultiShippingSuccess } = useCheckout({ skipInitialFetch: true });
    const [orders, setOrders] = useState<OrderRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        if (hasFetched) return;
        if (!orderId || orderId === "placed") {
            if (!orderId) router.push(lp("/"));
            setIsLoading(false);
            return;
        }

        const getSuccessData = async () => {
            setHasFetched(true);

            try {
                // Call success API with comma-separated entity_ids
                // e.g. /api/kleverapi/multishipping/success/28675,28676,28677
                const data = await fetchMultiShippingSuccess(orderId);
                console.log(">>> Multi-Shipping Success Data:", data);

                // Magento returns: { message: "...", orders: [...], continue_shopping_url: "..." }
                const apiOrders = Array.isArray(data?.orders) ? data.orders
                    : Array.isArray(data) ? data
                    : [];

                const parsed: OrderRow[] = apiOrders.map((o: any) => ({
                    order_id: String(o.order_id || ""),
                    order_increment_id: o.order_increment_id || o.increment_id || String(o.order_id || ""),
                    shipping_address: o.shipping_address || o.shipping_address_display || o.ship_to || "",
                }));

                if (parsed.length > 0) {
                    setOrders(parsed);
                } else {
                    // Fallback: show the order IDs from URL
                    setOrders(orderId.split(",").map(id => ({
                        order_id: id,
                        order_increment_id: id,
                        shipping_address: "",
                    })));
                }
            } catch (error) {
                console.error("Multi-Shipping Success API Error:", error);
                // Fallback: show order IDs from URL
                setOrders(orderId.split(",").map(id => ({
                    order_id: id,
                    order_increment_id: id,
                    shipping_address: "",
                })));
            }
            setIsLoading(false);
        };

        getSuccessData();
    }, [orderId, fetchMultiShippingSuccess, router, hasFetched]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-gray-200 border-t-[#f5b21a] rounded-full animate-spin" />
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">VERIFYING YOUR ORDER...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen font-sans pb-20">
            <div className="max-w-[1200px] mx-auto pt-10 md:pt-20 px-4">

                {/* Header */}
                <div className="text-center mb-10 md:mb-16">
                    <h1 className="text-[24px] md:text-[32px] font-black text-black uppercase tracking-tight mb-4">
                        THANK YOU FOR YOUR PURCHASE!
                    </h1>
                    <p className="text-[13px] md:text-[14px] text-black font-medium max-w-4xl mx-auto leading-relaxed">
                        For successfully order items, you'll receive a confirmation email including order numbers, tracking information and more details.
                    </p>
                </div>

                {/* Successfully ordered */}
                <div className="mb-6 text-center">
                    <h2 className="text-[15px] md:text-[16px] font-bold text-black tracking-tight">
                        Successfully ordered
                    </h2>
                </div>

                <div className="border border-gray-200 shadow-sm overflow-hidden">
                    {/* Table Header */}
                    <div className="flex bg-[#f8f8f8] border-b border-gray-200 py-3 px-6">
                        <div className="w-[180px] md:w-[220px] flex-shrink-0 text-[12px] md:text-[13px] font-black text-black">Order Id</div>
                        <div className="flex-1 text-[12px] md:text-[13px] font-black text-black">Ship to</div>
                    </div>

                    {/* Table Body */}
                    <div className="bg-white">
                        {orders.length > 0 ? orders.map((order, index) => (
                            <div
                                key={index}
                                className="flex border-b border-gray-100 last:border-b-0 border-l-4 border-l-[#f5b21a] py-5 px-6 items-start bg-[#fafafa]"
                            >
                                <div className="w-[180px] md:w-[220px] flex-shrink-0">
                                    <span className="text-[13px] md:text-[14px] font-black text-black">
                                        {order.order_increment_id}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[13px] md:text-[14px] text-gray-700 font-medium">
                                        {order.shipping_address || t("m.address")}
                                    </p>
                                </div>
                            </div>
                        )) : (
                            <div className="py-10 text-center text-gray-400 text-[14px]">
                                No order details found.
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-[#f2f2f2] p-4 flex justify-end">
                        <Link
                            href={lp("/products")}
                            className="bg-[#f5b21a] text-black px-8 md:px-12 py-3 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-black hover:text-white transition-all shadow-sm"
                        >
                            CONTINUE SHOPPING
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MultiShippingSuccessPage;
