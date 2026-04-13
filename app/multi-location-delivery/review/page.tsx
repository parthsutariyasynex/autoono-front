"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { useLocalePath } from "@/hooks/useLocalePath";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useCheckout, Address } from "@/modules/checkout/hooks/useCheckout";
import { useRouter } from "next/navigation";
import { Loader2, Upload } from "lucide-react";
import toast from "react-hot-toast";
import Price from "@/app/components/Price";

type Assignments = Record<number, Record<string, number>>;

interface AddressGroup {
    address: Address;
    items: Array<{
        name: string;
        qty: number;
        price: number;
        itemId: number;
    }>;
    poNumber?: string;
    orderComment?: string;
}

const MultiShippingReviewPage: React.FC = () => {
    const router = useRouter();
    const { t } = useTranslation();
    const lp = useLocalePath();
    const { cart, isLoading: isCartLoading, clearCart } = useCart();
    const {
        addresses,
        paymentMethods,
        isLoading: isCheckoutLoading,
        placeOrder,
        placeMultiShippingOrder,
        startMultiShipping,
        assignMultiShipping,
        fetchMultiShippingMethods,
        setMultiShippingMethods,
        setMultiShippingBillingAddress,
        refetchTotals,
        totals
    } = useCheckout();

    const [groups, setGroups] = useState<AddressGroup[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPlacingOrder, setIsPlacingOrder] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);

    // Billing info from localStorage or selections
    const [billingAddress, setBillingAddress] = useState<Address | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<{ code: string, title: string } | null>(null);

    useEffect(() => {
        const loadReviewData = async () => {
            if (orderPlaced || isPlacingOrder) return;
            if (isCartLoading || isCheckoutLoading) return;
            if (!cart?.items || addresses.length === 0) return;

            try {
                const savedAssignments = localStorage.getItem('multi_shipping_assignments');
                const savedPaymentCode = localStorage.getItem('multi_shipping_payment_method');
                const savedBillingId = localStorage.getItem('multi_shipping_billing_address_id');

                if (!savedAssignments) {
                    router.push('/multi-location-delivery');
                    return;
                }

                setIsLoading(true);

                // 1. Process Groups (from localStorage assignments)
                const assignments: Assignments = JSON.parse(savedAssignments);
                const groupedMap: Record<string, AddressGroup> = {};

                Object.entries(assignments).forEach(([itemIdStr, addrQtyMap]) => {
                    const itemId = parseInt(itemIdStr);
                    const cartItem = cart?.items.find(i => i.item_id === itemId);
                    if (!cartItem) return;

                    Object.entries(addrQtyMap).forEach(([addrId, qty]) => {
                        if (qty > 0) {
                            if (!groupedMap[addrId]) {
                                const address = addresses.find(a => a.id === addrId || a.id === addrId.toString());
                                if (!address) return;
                                groupedMap[addrId] = { address, items: [] };
                            }
                            groupedMap[addrId].items.push({
                                name: cartItem.name,
                                qty: qty,
                                price: cartItem.price,
                                itemId: itemId
                            });
                        }
                    });
                });

                setGroups(Object.values(groupedMap));

                // 2. Set Billing Info
                if (savedBillingId) {
                    const bAddr = addresses.find(a => a.id === savedBillingId);
                    if (bAddr) setBillingAddress(bAddr);
                } else {
                    setBillingAddress(addresses.find(a => a.isDefault) || addresses[0] || null);
                }

                if (savedPaymentCode && paymentMethods.length > 0) {
                    const pMethod = paymentMethods.find(m => m.code === savedPaymentCode);
                    if (pMethod) setPaymentMethod(pMethod);
                    else setPaymentMethod(paymentMethods[0]);
                } else if (paymentMethods.length > 0) {
                    setPaymentMethod(paymentMethods[0]);
                }

                await refetchTotals();

            } catch (err) {
                console.error("Error loading review data:", err);
                toast.error("Failed to load review information.");
            } finally {
                setIsLoading(false);
            }
        };

        loadReviewData();
    }, [cart, addresses, paymentMethods, isCartLoading, isCheckoutLoading, refetchTotals, router, isPlacingOrder, orderPlaced]);

    // Set payment method once paymentMethods loads (may arrive after initial effect)
    useEffect(() => {
        if (paymentMethod || paymentMethods.length === 0) return;
        const savedPaymentCode = localStorage.getItem('multi_shipping_payment_method');
        if (savedPaymentCode) {
            const pMethod = paymentMethods.find(m => m.code === savedPaymentCode);
            setPaymentMethod(pMethod || paymentMethods[0]);
        } else {
            setPaymentMethod(paymentMethods[0]);
        }
    }, [paymentMethods, paymentMethod]);

    // Per-address group inputs state
    const [groupData, setGroupData] = useState<Record<string, { poNumber: string, comment: string }>>({});
    const [generalComment, setGeneralComment] = useState("");

    const handleDataChange = (addrId: string, field: 'poNumber' | 'comment', value: string) => {
        setGroupData(prev => ({
            ...prev,
            [addrId]: {
                ...prev[addrId] || { poNumber: '', comment: '' },
                [field]: value
            }
        }));
    };

    const handlePlaceOrder = async () => {
        if (!billingAddress || !paymentMethod) {
            toast.error("Missing billing or payment information");
            return;
        }

        try {
            setIsPlacingOrder(true);

            const savedMethodsForPayload: Record<string, string> = JSON.parse(localStorage.getItem('multi_shipping_methods') || '{}');
            const shippingInformation = groups.map(group => ({
                address_id: String(group.address.id),
                shipping_method: savedMethodsForPayload[group.address.id] || "flatrate_flatrate",
                po_number: groupData[group.address.id]?.poNumber || "",
                order_comment: groupData[group.address.id]?.comment || ""
            }));

            const payload = {
                billing_address_id: String(billingAddress.id),
                payment_method: paymentMethod.code || "checkmo",
                general_comment: generalComment || "",
                shipping_information: shippingInformation
            };

            console.log(">>> Multi-Shipping Place Order Payload:", JSON.stringify(payload, null, 2));

            const result = await placeMultiShippingOrder(payload);
            console.log(">>> Multi-Shipping Place Order RESULT:", JSON.stringify(result, null, 2));

            // Mark order as placed BEFORE clearing localStorage to prevent effect re-triggering
            setOrderPlaced(true);
            toast.success("Order placed successfully!");

            // Extract ALL entity_ids (numeric) from the place-order result
            // Magento success API needs comma-separated entity_ids like: /success/28675,28676,28677
            let entityIds: string[] = [];
            if (result) {
                if (Array.isArray(result.order_ids)) {
                    entityIds = result.order_ids.map((id: any) => String(id));
                } else if (Array.isArray(result.orders)) {
                    entityIds = result.orders.map((o: any) => String(o.order_id || o.entity_id || o.id));
                } else if (Array.isArray(result)) {
                    entityIds = result.map((o: any) => typeof o === 'object' ? String(o.order_id || o.entity_id || o.id) : String(o));
                } else if (result.order_id || result.entity_id || result.id) {
                    entityIds = [String(result.order_id || result.entity_id || result.id)];
                } else if (typeof result === "number" || typeof result === "string") {
                    entityIds = [String(result)];
                }
            }

            console.log(">>> Extracted entity IDs for success page:", entityIds);

            // Clear cart after successful order
            try { await clearCart(); } catch { /* cart will refresh on next visit */ }

            // Clean up localStorage for this flow
            localStorage.removeItem('multi_shipping_assignments');
            localStorage.removeItem('multi_shipping_methods');
            localStorage.removeItem('multi_shipping_billing_address_id');
            localStorage.removeItem('multi_shipping_payment_method');

            // Redirect with comma-separated entity_ids — success page will call the API
            const redirectId = entityIds.length > 0 ? entityIds.join(",") : "placed";
            router.push(lp(`/multi-location-delivery/success?order_id=${redirectId}`));
        } catch (err: any) {
            console.error("Multi-Shipping Place Order Error:", err);
            toast.error(err.message || "Failed to place multi-shipping order. Please try again.");
        } finally {
            setIsPlacingOrder(false);
        }
    };

    if (isLoading || isCartLoading || isCheckoutLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-gray-100 border-t-[#f5b21a] rounded-full animate-spin" />
            </div>
        );
    }

    const grandTotal = groups.reduce((acc, group) => {
        const itemTotal = group.items.reduce((sum, item) => sum + item.price * item.qty, 0);
        const vat = itemTotal * 0.15; // 15% VAT placeholder
        return acc + itemTotal + vat;
    }, 0);

    return (
        <div className="bg-white min-h-screen font-sans pb-10 md:pb-20">
            <div className="max-w-[1240px] mx-auto pt-6 md:pt-10 px-3 sm:px-4">
                <h1 className="text-[20px] sm:text-[24px] md:text-[28px] font-black text-black text-center uppercase mb-3 md:mb-4 tracking-tight">
                    REVIEW ORDER
                </h1>

                {/* Billing Information Section */}
                <h3 className="text-[14px] sm:text-[15px] md:text-[17px] font-black text-black text-center mb-5 md:mb-8 uppercase tracking-tight">
                    Billing Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 mb-8 md:mb-12">
                    {/* Billing Address */}
                    <div className="flex flex-col bg-[#f7f7f7] border border-gray-100">
                        <div className="bg-[#e2e2e2] py-3 md:py-3.5 px-4 md:px-6 text-center">
                            <h2 className="text-[11px] font-[900] text-black uppercase tracking-widest">
                                BILLING ADDRESS
                            </h2>
                        </div>
                        <div className="p-5 md:p-8 text-[13px] md:text-[14px] text-black leading-[1.7]">
                            {billingAddress ? (
                                <>
                                    <p className="font-bold uppercase tracking-tight mb-0.5">{billingAddress.firstname} {billingAddress.lastname}</p>
                                    <p className="mb-0.5">{billingAddress.company}</p>
                                    <p className="mb-0.5">{billingAddress.street}</p>
                                    <p className="mb-0.5">{billingAddress.city}, {billingAddress.postcode}</p>
                                    <p className="mb-0.5">Saudi Arabia</p>
                                    <p className="mt-3">T: {billingAddress.telephone}</p>
                                </>
                            ) : <p className="text-gray-400">Loading billing address...</p>}
                        </div>
                    </div>

                    {/* Payment Method & Commitment */}
                    <div className="flex flex-col bg-[#f7f7f7] border border-gray-100">
                        <div className="bg-[#e2e2e2] py-3 md:py-3.5 px-4 md:px-6 text-center">
                            <h2 className="text-[11px] font-[900] text-black uppercase tracking-widest">
                                PAYMENT METHOD
                            </h2>
                        </div>
                        <div className="p-5 md:p-8 space-y-4 md:space-y-6">
                            <div className="text-center">
                                <p className="text-[13px] md:text-[14px] font-black text-black uppercase tracking-tight">
                                    {paymentMethod?.title || t("m.credit-account")}
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[11px] font-black text-black uppercase tracking-widest mb-2">Payment Commitment Upload</p>
                                    <div className="border-2 border-dashed border-gray-300 bg-white p-6 md:p-10 flex flex-col items-center justify-center text-center cursor-pointer hover:border-gray-400 transition-colors">
                                        <p className="text-[13px] md:text-[15px] font-bold text-gray-800 mb-2">Drop files here</p>
                                        <p className="text-[9px] md:text-[10px] text-gray-500 font-medium whitespace-pre-wrap">
                                            Allowed file types : jpg,jpeg,png,zip,rar,docx,doc,pdf,xls,xlsx,csv
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[11px] font-black text-black uppercase tracking-widest mb-2">Leave Comment</p>
                                    <textarea
                                        value={generalComment}
                                        onChange={(e) => setGeneralComment(e.target.value)}
                                        className="w-full border border-gray-300 p-3 md:p-4 min-h-[80px] md:min-h-[100px] outline-none focus:ring-1 focus:ring-black rounded-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <hr className="border-transparent my-8 md:my-16" />

                {/* Shipping Information Header */}
                <h3 className="text-[17px] sm:text-[18px] md:text-[20px] font-black text-black text-center mb-4 uppercase tracking-tighter">
                    Shipping Information
                </h3>

                {/* Groups iteration */}
                {groups.map((group, index) => {
                    const itemTotal = group.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
                    const vat = itemTotal * 0.15;
                    const groupTotal = itemTotal + vat;

                    return (
                        <div key={group.address.id} className="mb-12 md:mb-24 last:mb-0">
                            <p className="text-[13px] md:text-[14px] font-bold text-black text-center mb-6 md:mb-10 tracking-tight">
                                Address {index + 1} <span className="text-gray-400 font-normal">of {groups.length}</span>
                            </p>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4">
                                {/* Column 1: Shipping To */}
                                <div className="flex flex-col bg-[#f7f7f7]">
                                    <div className="bg-[#dadada] py-2.5 px-4 md:px-6 text-center">
                                        <h2 className="text-[11px] font-[900] text-black uppercase tracking-widest">SHIPPING TO</h2>
                                    </div>
                                    <div className="p-5 md:p-8 text-[13px] md:text-[14px] text-black leading-[1.7] flex-grow">
                                        <p className="font-bold uppercase mb-0.5">{group.address.firstname} {group.address.lastname}</p>
                                        <p className="mb-0.5">{group.address.company}</p>
                                        <p className="mb-0.5">{group.address.street}</p>
                                        <p className="mb-0.5">{group.address.city}, {group.address.postcode}</p>
                                        <p className="mb-0.5">Saudi Arabia</p>
                                        <p className="mt-3">T: {group.address.telephone}</p>
                                        {group.address.custom_attributes?.find(a => a.attribute_code === 'vat_number')?.value && (
                                            <p>VAT: {group.address.custom_attributes.find(a => a.attribute_code === 'vat_number')?.value}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Column 2: PO Number & Upload */}
                                <div className="flex flex-col bg-[#f7f7f7]">
                                    <div className="bg-[#dadada] py-2.5 px-4 md:px-6 text-center">
                                        <h2 className="text-[11px] font-[900] text-black uppercase tracking-widest">CUSTOMER PO NUMBER</h2>
                                    </div>
                                    <div className="p-5 md:p-8 space-y-4 md:space-y-6 flex-grow">
                                        <div>
                                            <p className="text-[11px] font-black text-black uppercase mb-2">PO Number</p>
                                            <input
                                                type="text"
                                                value={groupData[group.address.id]?.poNumber || ""}
                                                onChange={(e) => handleDataChange(group.address.id, 'poNumber', e.target.value)}
                                                className="w-full border border-gray-300 p-3 h-[42px] outline-none bg-white rounded-none"
                                            />
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-black uppercase mb-2">Upload PO</p>
                                            <div className="border-2 border-dashed border-gray-300 bg-white p-5 md:p-8 flex flex-col items-center justify-center text-center">
                                                <p className="text-[13px] md:text-[14px] font-bold text-gray-800 mb-2">Drop files here</p>
                                                <p className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter">
                                                    Allowed file types : jpg,jpeg,png,zip,rar,docx,doc,pdf,xls,xlsx,csv
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-black uppercase mb-2">Order Comment</p>
                                            <textarea
                                                value={groupData[group.address.id]?.comment || ""}
                                                onChange={(e) => handleDataChange(group.address.id, 'comment', e.target.value)}
                                                className="w-full border border-gray-300 p-3 min-h-[80px] bg-white rounded-none resize-none outline-none"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Column 3: Items Table */}
                                <div className="flex flex-col bg-[#f7f7f7]">
                                    <div className="p-0 overflow-x-auto flex-grow">
                                        <table className="w-full text-left border-collapse min-w-[320px]">
                                            <thead>
                                                <tr className="border-b border-transparent">
                                                    <th className="py-3 md:py-4 px-3 md:px-6 text-[11px] md:text-[12px] font-black text-black uppercase w-[40%] md:w-[50%]">Item</th>
                                                    <th className="py-3 md:py-4 px-2 md:px-4 text-[11px] md:text-[12px] font-black text-black uppercase text-right">Price</th>
                                                    <th className="py-3 md:py-4 px-2 md:px-4 text-[11px] md:text-[12px] font-black text-black uppercase text-right">Qty</th>
                                                    <th className="py-3 md:py-4 px-3 md:px-6 text-[11px] md:text-[12px] font-black text-black uppercase text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-transparent">
                                                {group.items.map((item) => (
                                                    <tr key={item.itemId}>
                                                        <td className="py-3 md:py-4 px-3 md:px-6 text-[12px] md:text-[13px] font-medium text-gray-600 align-top uppercase leading-tight">
                                                            {item.name}
                                                        </td>
                                                        <td className="py-3 md:py-4 px-2 md:px-4 text-[12px] md:text-[13px] font-black text-black text-right align-top">
                                                            <Price amount={item.price} />
                                                        </td>
                                                        <td className="py-3 md:py-4 px-2 md:px-4 text-[12px] md:text-[13px] font-black text-black text-right align-top">
                                                            {item.qty}
                                                        </td>
                                                        <td className="py-3 md:py-4 px-3 md:px-6 text-[12px] md:text-[13px] font-black text-black text-right align-top">
                                                            <Price amount={item.price * item.qty} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr>
                                                    <td colSpan={3} className="py-2 px-3 md:px-6 text-right text-[11px] md:text-[12px] font-[900] text-black uppercase">ITEM(S) TOTAL:</td>
                                                    <td className="py-2 px-3 md:px-6 text-right text-[11px] md:text-[12px] font-black text-black"><Price amount={itemTotal} /></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={3} className="py-2 px-3 md:px-6 text-right text-[11px] md:text-[12px] font-[900] text-black uppercase">VAT (15%):</td>
                                                    <td className="py-2 px-3 md:px-6 text-right text-[11px] md:text-[12px] font-black text-black"><Price amount={vat} /></td>
                                                </tr>
                                                <tr>
                                                    <td colSpan={3} className="py-4 md:py-6 px-3 md:px-6 text-right text-[12px] md:text-[14px] font-[900] text-black uppercase">Total for this address</td>
                                                    <td className="py-4 md:py-6 px-3 md:px-6 text-right text-[12px] md:text-[14px] font-black text-black"><Price amount={groupTotal} /></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Grand Total Area */}
                <div className="mt-8 md:mt-12 mb-6 md:mb-8 flex justify-center md:justify-end">
                    <p className="text-[16px] sm:text-[18px] md:text-[20px] font-black text-black uppercase">
                        Grand Total: <span className="ml-2 md:ml-4"><Price amount={grandTotal} /></span>
                    </p>
                </div>

                {/* Final Actions */}
                <div className="bg-[#f2f2f2] p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4">
                    <button
                        onClick={() => router.push('/multi-location-delivery/billing')}
                        className="w-full sm:w-auto bg-black text-white px-6 md:px-10 py-3.5 md:py-4 text-[11px] font-black uppercase tracking-[0.15em] hover:opacity-90 transition-opacity text-center"
                    >
                        BACK TO BILLING INFORMATION
                    </button>

                    <button
                        onClick={handlePlaceOrder}
                        disabled={isPlacingOrder}
                        className="w-full sm:w-auto bg-[#f5b21a] text-black px-10 md:px-16 py-3.5 md:py-4 text-[11px] font-black uppercase tracking-[0.15em] hover:bg-black hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                        {isPlacingOrder && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        PLACE ORDER
                    </button>
                </div>
            </div>

            <style jsx>{`
                .font-sans {
                    font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                }
            `}</style>
        </div>
    );
};

export default MultiShippingReviewPage;
