"use client";

import React, { useEffect, useState, useMemo } from "react";
import Navbar from "@/app/components/Navbar";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useCheckout, Address } from "@/modules/checkout/hooks/useCheckout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

/**
 * State structure for quantity assignments:
 * assignments[itemId][addressId] = quantity
 */
type Assignments = Record<number, Record<string, number>>;

const MultiLocationDeliveryPage: React.FC = () => {
    const router = useRouter();
    const { cart, isLoading: isCartLoading, refetchCart } = useCart();
    const {
        addresses,
        refetchAddresses,
        isLoading: isCheckoutLoading,
        assignMultiShipping
    } = useCheckout({ skipInitialFetch: true });

    const [isAssigning, setIsAssigning] = useState(false);

    const [assignments, setAssignments] = useState<Assignments>({});

    useEffect(() => {
        refetchCart();
        refetchAddresses();
    }, [refetchCart, refetchAddresses]);

    useEffect(() => {
        if (cart?.items && addresses.length > 0 && Object.keys(assignments).length === 0) {
            const initial: Assignments = {};
            cart.items.forEach(item => {
                initial[item.item_id] = {};
                addresses.forEach(addr => {
                    initial[item.item_id][addr.id] = 0;
                });
            });
            setAssignments(initial);
        }
    }, [cart, addresses, assignments]);

    const handleQtyChange = (itemId: number, addressId: string, value: string) => {
        const cleanedValue = value.replace(/[^0-9]/g, "");
        const numVal = parseInt(cleanedValue) || 0;

        setAssignments(prev => ({
            ...prev,
            [itemId]: {
                ...(prev[itemId] || {}),
                [addressId]: numVal
            }
        }));
    };

    const validation = useMemo(() => {
        if (!cart?.items || addresses.length === 0) return { isValid: false, perItem: {} };

        let allValid = true;
        const perItem: Record<number, boolean> = {};

        cart.items.forEach(item => {
            const itemAssignments = assignments[item.item_id] || {};
            const totalAssigned = Object.values(itemAssignments).reduce((sum, q) => sum + q, 0);
            const isItemValid = totalAssigned === item.qty;
            perItem[item.item_id] = isItemValid;
            if (!isItemValid) {
                allValid = false;
            }
        });

        return { isValid: allValid, perItem };
    }, [cart, addresses, assignments]);

    const handleProceed = async () => {
        if (!validation.isValid || !cart?.items) return;

        try {
            setIsAssigning(true);

            // Format assignments for API
            const apiAssignments: Array<{ quote_item_id: number, customer_address_id: number | string, qty: number }> = [];

            cart.items.forEach(item => {
                const itemAssignments = assignments[item.item_id] || {};
                Object.entries(itemAssignments).forEach(([addressId, qty]) => {
                    if (qty > 0) {
                        apiAssignments.push({
                            quote_item_id: item.item_id,
                            customer_address_id: addressId,
                            qty: qty
                        });
                    }
                });
            });

            if (apiAssignments.length === 0) {
                toast.error("Please assign items to at least one address.");
                return;
            }

            console.log("Submitting Multi-shipping Assignments:", apiAssignments);
            await assignMultiShipping(apiAssignments);

            // On success
            localStorage.setItem('multi_shipping_assignments', JSON.stringify(assignments));
            toast.success("Addresses assigned successfully!");
            router.push('/multi-location-delivery/shipping');
        } catch (err: any) {
            console.error("Assignment error:", err);
            toast.error(err.message || "Failed to assign addresses. Please try again.");
        } finally {
            setIsAssigning(false);
        }
    };

    const isReadyToProceed = validation.isValid && !isAssigning;

    if (isCartLoading || isCheckoutLoading && !isAssigning) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-gray-100 border-t-[#f5b21a] rounded-full animate-spin" />
            </div>
        );
    }

    // EMPTY CART STATE - Matching User Screenshot exactly
    if (!cart?.items || cart.items.length === 0) {
        return (
            <div className="bg-white min-h-screen font-sans">
                <Navbar />
                <div className="max-w-[1440px] mx-auto py-24 px-4 flex flex-col items-center text-center">
                    <h1 className="text-[28px] font-black text-black uppercase mb-12 tracking-wide">
                        SHOPPING CART
                    </h1>

                    <div className="relative mb-8">
                        <ShoppingCart size={80} strokeWidth={1.5} className="text-black" />
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5">
                            <div className="bg-white border-2 border-black rounded-full w-8 h-8 flex items-center justify-center font-black text-black text-[18px]">
                                !
                                <div className="absolute inset-0 rounded-full border border-white"></div>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-[17px] font-bold text-black uppercase tracking-tight mb-8">
                        YOU HAVE NO ITEMS IN YOUR SHOPPING CART.
                    </h2>

                    <Link
                        href="/"
                        className="bg-[#f5b21a] text-black px-12 py-4 text-[13px] font-black uppercase tracking-[0.1em] hover:bg-black hover:text-white transition-all shadow-md"
                    >
                        CONTINUE SHOPPING
                    </Link>
                </div>
            </div>
        );
    }

    const getAddressLocation = (addr: Address) => {
        return addr.city || "Location";
    };

    return (
        <div className="bg-white min-h-screen font-sans pb-32">
            <Navbar />

            <div className="max-w-[1440px] mx-auto py-12 px-4 sm:px-6 lg:px-10">
                {/* Heading Block */}
                <div className="text-center mb-10">
                    <h1 className="text-[26px] font-black text-black uppercase tracking-normal mb-1">
                        SHIP TO MULTIPLE ADDRESSES
                    </h1>
                    <p className="text-[14px] text-gray-800 font-medium italic">
                        Please assign Qty against shipping address for applicable items.
                    </p>
                </div>

                {/* Main Table Structure */}
                <div className="relative border border-gray-300 overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse border-spacing-0 min-w-max">
                            <thead>
                                {/* Top Header Row */}
                                <tr>
                                    <th
                                        rowSpan={2}
                                        className="py-5 px-6 text-left text-[14px] font-black uppercase text-black border-r border-b border-gray-300 w-[240px] bg-white align-middle"
                                    >
                                        Product
                                    </th>
                                    <th className="py-5 px-4 text-center text-[14px] font-black uppercase text-black border-r border-b border-gray-300 w-[120px] bg-white">
                                        Cart Qty
                                    </th>
                                    <th
                                        className="py-5 px-4 text-center text-[14px] font-black uppercase text-black border-b border-gray-300 bg-white"
                                        colSpan={addresses.length + 1}
                                    >
                                        Assign Qty against Shipping Location
                                    </th>
                                </tr>
                                {/* Sub Header Row */}
                                <tr>
                                    <th className="py-4 text-center text-[12px] font-bold text-black border-r border-b border-gray-300 uppercase bg-white">
                                        Qty
                                    </th>
                                    {addresses.map((addr) => (
                                        <th
                                            key={addr.id}
                                            className="py-4 px-4 text-center text-[12px] font-bold text-black border-r border-b border-gray-300 uppercase bg-white min-w-[150px]"
                                        >
                                            {getAddressLocation(addr)}
                                        </th>
                                    ))}
                                    <th className="border-b border-gray-300 bg-white min-w-[140px]"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart?.items.map((item) => {
                                    const isItemValid = validation.perItem[item.item_id];
                                    return (
                                        <tr key={item.item_id} className="border-b border-gray-300 last:border-b-0">
                                            {/* Column 1: Product Information */}
                                            <td className="py-10 px-6 border-r border-gray-300 align-middle">
                                                <span className="text-[14px] font-bold text-black leading-tight max-w-[200px] uppercase block">
                                                    {item.name}
                                                </span>
                                            </td>

                                            {/* Column 2: Cart Qty Box */}
                                            <td className="py-10 px-4 border-r border-gray-300 align-middle">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-[11px] font-bold text-black mb-2 uppercase tracking-tighter">Qty</span>
                                                    <div className="w-[50px] h-[38px] flex items-center justify-center border border-gray-300 text-gray-400 font-bold bg-white">
                                                        {item.qty}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Dynamic Address Columns */}
                                            {addresses.map((addr) => {
                                                const currentVal = assignments[item.item_id]?.[addr.id] ?? 0;
                                                const cityLabel = getAddressLocation(addr);
                                                return (
                                                    <td
                                                        key={addr.id}
                                                        className="py-10 px-4 border-r border-gray-300 align-middle"
                                                    >
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[11px] font-bold text-black mb-2 uppercase tracking-tighter">{cityLabel}</span>
                                                            <input
                                                                type="text"
                                                                inputMode="numeric"
                                                                value={currentVal}
                                                                onChange={(e) => handleQtyChange(item.item_id, addr.id, e.target.value)}
                                                                className="w-[50px] h-[38px] text-center text-[14px] font-bold border border-black rounded-none outline-none focus:ring-1 focus:ring-black transition-all"
                                                            />
                                                        </div>
                                                    </td>
                                                );
                                            })}

                                            {/* Validation Row Message */}
                                            <td className="py-10 px-4 align-middle bg-white">
                                                {!isItemValid && (
                                                    <div className="text-[#ff0000] text-[11px] font-bold leading-[1.3] text-center whitespace-pre-line uppercase tracking-tight">
                                                        Assigned{"\n"}Qty{"\n"}should{"\n"}be{"\n"}matched{"\n"}with{"\n"}Cart Qty.
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="mt-8 bg-[#f2f2f2] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 border border-gray-100">
                    <Link
                        href="/cart"
                        className="bg-black text-white px-10 py-4 text-[11px] font-black uppercase tracking-[0.1em] hover:bg-zinc-900 transition-colors"
                    >
                        BACK TO SHOPPING CART
                    </Link>

                    <button
                        onClick={handleProceed}
                        disabled={!isReadyToProceed || isAssigning}
                        className={`px-10 py-4 text-[11px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2
                            ${isReadyToProceed
                                ? 'bg-[#f5b21a] text-black hover:bg-black hover:text-white cursor-pointer'
                                : 'bg-[#f5b21a]/60 text-black/40 cursor-not-allowed'
                            }
                        `}
                    >
                        {isAssigning ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                PROCESSING...
                            </>
                        ) : (
                            "PROCEED TO SHIPPING INFORMATION"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MultiLocationDeliveryPage;

