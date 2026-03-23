"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Navbar from "@/app/components/Navbar";
import { useCart } from "@/modules/cart/hooks/useCart";
import { useCheckout, Address } from "@/modules/checkout/hooks/useCheckout";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";

type Assignments = Record<number, Record<string, number>>;

interface AddressGroup {
    address: Address;
    items: Array<{
        name: string;
        qty: number;
        itemId: number;
    }>;
}

const MultiShippingShippingPage: React.FC = () => {
    const router = useRouter();
    const { cart, isLoading: isCartLoading } = useCart();
    const {
        addresses,
        isLoading: isCheckoutLoading,
        fetchMultiShippingMethods
    } = useCheckout(); // Automatically loads addresses on mount

    const [groups, setGroups] = useState<AddressGroup[]>([]);
    const [shippingMethods, setShippingMethods] = useState<Record<string, any[]>>({});
    const [selectedMethods, setSelectedMethods] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Use a ref to prevent infinite loop triggered by isCheckoutLoading changes
    const hasFetched = useRef(false);

    useEffect(() => {
        const loadInitialData = async () => {
            // Wait for dependencies to be ready
            if (isCartLoading || isCheckoutLoading) return;

            // If already fetched, don't repeat (prevents infinite loop from hook state updates)
            if (hasFetched.current) return;

            // If data is genuinely missing after loading finished
            if (!cart?.items || addresses.length === 0) {
                setIsLoading(false);
                return;
            }

            try {
                const saved = localStorage.getItem('multi_shipping_assignments');
                if (!saved) {
                    router.push('/multi-location-delivery');
                    return;
                }

                hasFetched.current = true;
                setIsLoading(true);

                // 1. Process Assignments into Groups
                const assignments: Assignments = JSON.parse(saved);
                const groupedMap: Record<string, AddressGroup> = {};

                Object.entries(assignments).forEach(([itemIdStr, addrQtyMap]) => {
                    const itemId = parseInt(itemIdStr);
                    const cartItem = cart.items.find(i => i.item_id === itemId);
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
                                itemId: itemId
                            });
                        }
                    });
                });

                const processedGroups = Object.values(groupedMap);
                setGroups(processedGroups);

                // 2. Fetch Shipping Methods
                try {
                    const methodsData = await fetchMultiShippingMethods();
                    const normalizedMethods: Record<string, any[]> = {};

                    if (methodsData?.methods) {
                        Object.entries(methodsData.methods).forEach(([addrId, methods]: [string, any]) => {
                            normalizedMethods[addrId] = Array.isArray(methods) ? methods : [];
                        });
                    } else if (Array.isArray(methodsData)) {
                        processedGroups.forEach(g => normalizedMethods[g.address.id] = methodsData);
                    }

                    setShippingMethods(normalizedMethods);

                    // Auto-select first method for each address
                    const initialSelection: Record<string, string> = {};
                    Object.entries(normalizedMethods).forEach(([addrId, methods]) => {
                        if (methods.length > 0) {
                            initialSelection[addrId] = methods[0].code || methods[0].method_code;
                        }
                    });
                    setSelectedMethods(initialSelection);
                } catch (methodErr) {
                    console.error("Error fetching multi-shipping methods:", methodErr);
                    // Fallback dummy methods for UI testing
                    const dummyMethods = [
                        { code: 'flatrate_flatrate', title: 'Flat Rate', price: 15, currency: 'SAR' },
                        { code: 'free_free', title: 'Free Shipping', price: 0, currency: 'SAR' }
                    ];
                    const fallback: Record<string, any[]> = {};
                    processedGroups.forEach(g => fallback[g.address.id] = dummyMethods);
                    setShippingMethods(fallback);
                }
            } catch (err) {
                console.error("Error processing multi-shipping data:", err);
                toast.error("Failed to load your transaction state.");
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, [cart, addresses, isCartLoading, isCheckoutLoading, fetchMultiShippingMethods, router]);

    const handleSelectMethod = (addressId: string, methodCode: string) => {
        setSelectedMethods(prev => ({ ...prev, [addressId]: methodCode }));
    };

    if (isLoading || isCartLoading || isCheckoutLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="w-10 h-10 border-4 border-gray-100 border-t-[#f5b21a] rounded-full animate-spin" />
            </div>
        );
    }

    if (groups.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
                <h2 className="text-xl font-bold mb-4">No shipping assignments found.</h2>
                <button
                    onClick={() => router.push('/multi-location-delivery')}
                    className="bg-[#f5b21a] text-black px-8 py-3 font-bold uppercase"
                >
                    Back to Selection
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white min-h-screen font-sans pb-20">
            <Navbar />

            <div className="max-w-[1200px] mx-auto pt-10 px-4">
                <h1 className="text-[24px] font-[900] text-black text-center uppercase mb-3 tracking-tighter">
                    SELECT SHIPPING METHOD
                </h1>
                <p className="text-[15px] font-bold text-black text-center mb-12">
                    Address 1 <span className="text-gray-300 font-medium">of {groups.length}</span>
                </p>

                <div className="space-y-6">
                    {groups.map((group) => {
                        const methods = shippingMethods[group.address.id] || [];
                        const selected = selectedMethods[group.address.id];

                        return (
                            <div key={group.address.id} className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* Shipping To Section */}
                                    <div className="bg-[#f2f2f2] min-h-[250px] flex flex-col">
                                        <div className="bg-[#dadada] py-2.5 px-6 text-center">
                                            <h2 className="text-[11px] font-[900] text-black uppercase tracking-widest">
                                                SHIPPING TO
                                            </h2>
                                        </div>
                                        <div className="p-10 text-[14px] text-black leading-[1.6] flex-grow">
                                            <p className="mb-0.5">{group.address.firstname} {group.address.lastname}</p>
                                            <p className="mb-0.5">{group.address.company || "Company Name"}</p>
                                            <p className="mb-0.5">{group.address.street}</p>
                                            <p className="mb-0.5">{group.address.city}, {group.address.postcode}</p>
                                            <p className="mb-4">Saudi Arabia</p>
                                            <p className="">T: {group.address.telephone}</p>
                                        </div>
                                    </div>

                                    {/* Items Section */}
                                    <div className="bg-[#f2f2f2] min-h-[250px] flex flex-col">
                                        <div className="bg-[#dadada] py-2.5 px-6 text-center">
                                            <h2 className="text-[11px] font-[900] text-black uppercase tracking-widest">
                                                ITEMS
                                            </h2>
                                        </div>
                                        <div className="p-0 flex-grow">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="border-b border-[#e0e0e0]">
                                                        <th className="py-4 px-6 text-[12px] font-black text-black">Product Name</th>
                                                        <th className="py-4 px-6 text-[12px] font-black text-black text-right">Qty</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white">
                                                    {group.items.map((item) => (
                                                        <tr key={item.itemId} className="border-b border-[#f2f2f2] last:border-b-0">
                                                            <td className="py-4 px-6 text-[13px] font-medium text-gray-700">
                                                                {item.name}
                                                            </td>
                                                            <td className="py-4 px-6 text-[13px] font-medium text-gray-700 text-right">
                                                                {item.qty}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Methods Selection */}
                                {/* <div className="bg-white p-6 border border-[#f2f2f2]">
                                    <h3 className="text-[11px] font-black text-black uppercase tracking-widest mb-6">Select a Shipping Method:</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {methods.map((method) => (
                                            <label
                                                key={method.code || method.method_code}
                                                className={`
                                                    relative p-5 border-2 transition-all cursor-pointer flex flex-col items-center justify-center text-center
                                                    ${selected === (method.code || method.method_code)
                                                        ? 'border-[#f5b21a] bg-white shadow-sm'
                                                        : 'border-[#f2f2f2] bg-white hover:border-gray-200'
                                                    }
                                                `}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`shipMethod_${group.address.id}`}
                                                    className="hidden"
                                                    checked={selected === (method.code || method.method_code)}
                                                    onChange={() => handleSelectMethod(group.address.id, method.code || method.method_code)}
                                                />
                                                <span className="text-[13px] font-black text-black uppercase mb-1">{method.title}</span>
                                                <span className="text-[12px] font-bold text-[#f5b21a]">
                                                    ﷼ {method.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div> */}
                            </div>
                        );
                    })}
                </div>

                {/* Bottom Actions Bar */}
                <div className="mt-4 bg-[#f2f2f2] p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <button
                        onClick={() => router.push('/multi-location-delivery')}
                        className="bg-black text-white px-8 py-3.5 text-[11px] font-black uppercase tracking-wider hover:opacity-90 transition-opacity"
                    >
                        BACK TO SELECT ADDRESSES
                    </button>

                    <button
                        onClick={() => {
                            toast.success("Proceeding to Billing...");
                        }}
                        className="bg-[#f5b21a] text-black px-10 py-3.5 text-[11px] font-black uppercase tracking-wider hover:bg-black hover:text-white transition-all shadow-sm"
                    >
                        CONTINUE TO BILLING INFORMATION
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

export default MultiShippingShippingPage;
