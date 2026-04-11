"use client";

import React, { useEffect, useState } from "react";
import { useCheckout, Address } from "@/modules/checkout/hooks/useCheckout";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/useTranslation";

const MultiShippingBillingPage: React.FC = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const {
        addresses,
        paymentMethods,
        isLoading: isCheckoutLoading,
        setMultiShippingBillingAddress,
        startMultiShipping,
        assignMultiShipping,
        fetchMultiShippingMethods,
        setMultiShippingMethods,
        refetchPaymentMethods
    } = useCheckout();

    const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
    const [selectedPaymentCode, setSelectedPaymentCode] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Find default shipping or just first address to start with
        if (addresses.length > 0 && !selectedAddressId) {
            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr.id);
        }

        // Fetch payment methods when billing address changes if needed
        // but here we just fetch them once on mount
        refetchPaymentMethods();
    }, [addresses, selectedAddressId, refetchPaymentMethods]);

    useEffect(() => {
        if (paymentMethods.length > 0 && !selectedPaymentCode) {
            // Check if "Credit Account" is available (user screenshot shows it)
            // or just select first one
            const creditMethod = paymentMethods.find(m => m.code === 'credit_account' || m.code === 'creditaccount');
            setSelectedPaymentCode(creditMethod ? creditMethod.code : paymentMethods[0].code);
        }
    }, [paymentMethods, selectedPaymentCode]);

    const handleGoToReview = async () => {
        if (!selectedAddressId || !selectedPaymentCode) {
            toast.error("Please select a billing address and payment method.");
            return;
        }

        try {
            setIsSubmitting(true);

            // Re-initialize session and re-assign items (session may have expired)
            await startMultiShipping();
            const savedAssignments = localStorage.getItem('multi_shipping_assignments');
            if (savedAssignments) {
                const assignments = JSON.parse(savedAssignments);
                const apiAssignments: Array<{ quote_item_id: number; customer_address_id: string; qty: number }> = [];
                Object.entries(assignments).forEach(([itemId, addrMap]: [string, any]) => {
                    Object.entries(addrMap).forEach(([addrId, qty]: [string, any]) => {
                        if (qty > 0) apiAssignments.push({ quote_item_id: Number(itemId), customer_address_id: addrId, qty });
                    });
                });
                if (apiAssignments.length > 0) await assignMultiShipping(apiAssignments);
            }

            // Set shipping methods — try to extract quote_address_ids from response
            try {
                const methodsData = await fetchMultiShippingMethods();
                const methodsToSet: Record<string, string> = {};
                const findAndSet = (obj: any) => {
                    if (!obj) return;
                    if (Array.isArray(obj)) { obj.forEach((item: any) => findAndSet(item)); return; }
                    if (typeof obj === 'object') {
                        const qid = obj.quote_address_id ?? obj.quoteAddressId ?? obj.address_id ?? obj.id;
                        if (qid && typeof qid === 'number') {
                            const methods = obj.methods || obj.available_shipping_methods || obj.shipping_methods || obj.rates || [];
                            if (Array.isArray(methods) && methods.length > 0) {
                                const m = methods[0];
                                methodsToSet[String(qid)] = m.code || `${m.carrier_code || m.carrierCode || "flatrate"}_${m.method_code || m.methodCode || "flatrate"}`;
                            }
                        }
                        Object.entries(obj).forEach(([key, val]) => {
                            if (!isNaN(Number(key)) && Number(key) > 0 && Array.isArray(val) && (val as any[]).length > 0) {
                                const m = (val as any[])[0];
                                methodsToSet[key] = m.code || `${m.carrier_code || m.carrierCode || "flatrate"}_${m.method_code || m.methodCode || "flatrate"}`;
                            } else if (typeof val === 'object') { findAndSet(val); }
                        });
                    }
                };
                findAndSet(methodsData);
                if (Object.keys(methodsToSet).length > 0) await setMultiShippingMethods(methodsToSet);
            } catch (shippingErr) {
                console.warn("Setting shipping methods failed, proceeding:", shippingErr);
            }

            // Set billing address and payment method on the backend
            await setMultiShippingBillingAddress(selectedAddressId, selectedPaymentCode);

            // Store selected payment method for later use in review page
            localStorage.setItem('multi_shipping_payment_method', selectedPaymentCode);
            localStorage.setItem('multi_shipping_billing_address_id', selectedAddressId);

            toast.success("Billing information saved!");
            // router.push('/multi-location-delivery/review');
        } catch (err: any) {
            console.error("Billing update error:", err);
            toast.error(err.message || "Failed to save billing information.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isCheckoutLoading && addresses.length === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-gray-100 border-t-[#f5b21a] rounded-full animate-spin" />
            </div>
        );
    }

    const currentAddress = addresses.find(a => a.id === selectedAddressId);

    return (
        <div className="bg-white min-h-screen font-sans pb-10 md:pb-20">

            <div className="max-w-[1240px] mx-auto pt-8 md:pt-16 px-3 sm:px-4">
                <h1 className="text-[20px] sm:text-[24px] md:text-[28px] font-black text-black text-center uppercase mb-8 md:mb-16 tracking-tight">
                    BILLING INFORMATION
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12">
                    {/* Billing Address Block */}
                    <div className="flex flex-col bg-white border border-[#f0f0f0] shadow-sm">
                        <div className="bg-[#e9e9e9] py-3 px-4 md:px-6 text-center">
                            <h2 className="text-[11px] font-black text-black uppercase tracking-widest leading-none">
                                BILLING ADDRESS
                            </h2>
                        </div>
                        <div className="p-5 md:p-10 flex-grow min-h-[200px] md:min-h-[300px]">
                            {currentAddress ? (
                                <div className="text-[13px] md:text-[14px] text-black leading-[1.8] font-medium">
                                    <p className="font-black text-[14px] md:text-[15px] uppercase mb-1">{currentAddress.firstname} {currentAddress.lastname}</p>
                                    <p>{currentAddress.company}</p>
                                    <p>{currentAddress.street}</p>
                                    <p>{currentAddress.city}, {currentAddress.postcode}</p>
                                    <p>Saudi Arabia</p>
                                    <p className="mt-4">T: {currentAddress.telephone}</p>

                                </div>
                            ) : (
                                <p className="text-gray-400 italic">No address selected.</p>
                            )}
                        </div>
                    </div>

                    {/* Payment Method Block */}
                    <div className="flex flex-col bg-white border border-[#f0f0f0] shadow-sm">
                        <div className="bg-[#e9e9e9] py-3 px-4 md:px-6 text-center">
                            <h2 className="text-[11px] font-black text-black uppercase tracking-widest leading-none">
                                PAYMENT METHOD
                            </h2>
                        </div>
                        <div className="p-5 md:p-10 flex-grow min-h-[200px] md:min-h-[300px]">
                            <div className="space-y-4">
                                {paymentMethods.length > 0 ? (
                                    paymentMethods
                                        .filter(m => m.title !== "No Payment Information Required" && m.code !== "free")
                                        .map((method) => (
                                            <label
                                                key={method.code}
                                                className="flex items-center gap-3 cursor-pointer group"
                                            >
                                                <div className="relative flex items-center justify-center">
                                                    <input
                                                        type="radio"
                                                        name="payment_method"
                                                        disabled={isSubmitting}
                                                        checked={selectedPaymentCode === method.code}
                                                        onChange={() => setSelectedPaymentCode(method.code)}
                                                        className="appearance-none w-4 h-4 border-2 border-gray-300 rounded-full checked:border-[#f5b21a] focus:outline-none transition-all"
                                                    />
                                                    {selectedPaymentCode === method.code && (
                                                        <div className="absolute w-2 h-2 bg-[#f5b21a] rounded-full" />
                                                    )}
                                                </div>
                                                <span className="text-[13px] md:text-[14px] font-black text-black uppercase tracking-tight group-hover:text-[#f5b21a] transition-colors mt-0.5">
                                                    {method.title}
                                                </span>
                                            </label>
                                        ))
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex items-center justify-center">
                                            <div className="w-4 h-4 border-2 border-[#f5b21a] rounded-full" />
                                            <div className="absolute w-2 h-2 bg-[#f5b21a] rounded-full" />
                                        </div>
                                        <span className="text-[13px] md:text-[14px] font-black text-black uppercase tracking-tight mt-0.5">
                                            Credit Account
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="bg-[#f2f2f2] p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => router.push('/multi-location-delivery/shipping')}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto text-center bg-black text-white px-6 md:px-10 py-3.5 md:py-4 text-[11px] font-black uppercase tracking-[0.15em] hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        BACK TO SHIPPING INFORMATION
                    </button>

                    <button
                        onClick={handleGoToReview}
                        disabled={isSubmitting || !selectedAddressId || !selectedPaymentCode}
                        className="w-full sm:w-auto justify-center bg-[#f5b21a] text-black px-8 md:px-12 py-3.5 md:py-4 text-[11px] font-black uppercase tracking-[0.15em] hover:bg-black hover:text-white transition-all shadow-sm flex items-center gap-2 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed"
                    >
                        {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        GO TO REVIEW YOUR ORDER
                    </button>
                </div>
            </div>

            <style jsx>{`
                .font-sans {
                    font-family: var(--font-rubik), sans-serif;
                }
            `}</style>
        </div>
    );
};

export default MultiShippingBillingPage;
