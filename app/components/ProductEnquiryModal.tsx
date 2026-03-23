"use client";

import { useState, useMemo } from "react";
import { formatPrice } from "@/utils/helpers";
import { toast } from "react-hot-toast";
import { getSession } from "next-auth/react";
import Drawer from "./Drawer";

interface ProductEnquiryModalProps {
    productSku: string;
    productName: string;
    productPrice: number | string;
    isOpen: boolean;
    onClose: () => void;
}

export default function ProductEnquiryModal({
    productSku,
    productName,
    productPrice,
    isOpen,
    onClose,
}: ProductEnquiryModalProps) {
    const [formData, setFormData] = useState({
        quantity: "1",
        comment: "",
        notifyStock: true,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Derived product details for display
    const productDetails = useMemo(() => {
        if (!productName) return { brand: "N/A", size: "N/A", pattern: "N/A", year: "N/A" };

        const parts = productName.split(" ");
        if (parts.length < 4) {
            return { brand: parts[0] || "N/A", size: "N/A", pattern: "N/A", year: "N/A" };
        }

        const brand = parts[0];
        const year = parts[parts.length - 1];
        const pattern = parts[parts.length - 2];
        const size = parts.slice(1, parts.length - 2).join(" ");

        return { brand, size, pattern, year };
    }, [productName]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (parseInt(formData.quantity) <= 0) {
            toast.error("Quantity must be greater than 0");
            return;
        }

        setIsSubmitting(true);

        try {
            const session: any = await getSession();
            const token = session?.accessToken;

            const payload = {
                productSku,
                productName,
                qty: parseInt(formData.quantity),
                comment: formData.comment,
                notifyStock: formData.notifyStock
            };

            const response = await fetch("/api/kleverapi/enquiry", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Something went wrong");
            }

            toast.success("Enquiry submitted successfully!");
            onClose();
            // Reset form
            setFormData({
                quantity: "1",
                comment: "",
                notifyStock: true,
            });
        } catch (error: any) {
            console.error("Enquiry submission error:", error);
            toast.error(error.message || "Failed to submit enquiry.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col h-full bg-white font-sans">
                {/* HEADER */}
                <div className="bg-[#FFB82B] py-6 flex items-center justify-center relative flex-shrink-0">
                    <h2 className="text-[18px] font-bold text-black uppercase tracking-tight">Product Enquiry</h2>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 pb-10">
                    {/* Product Name (Read only) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-0.5">Product Name</label>
                        <div className="text-[15px] text-black font-semibold leading-snug bg-gray-50 p-4 rounded-lg border border-gray-100">
                            {productName}
                        </div>
                    </div>

                    {/* Derived Details Display */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-5 rounded-lg border border-gray-100">
                        <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-400 block uppercase font-black tracking-widest">Brand</span>
                            <span className="text-[14px] font-bold text-gray-800">{productDetails.brand}</span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-400 block uppercase font-black tracking-widest">Size</span>
                            <span className="text-[14px] font-bold text-gray-800">{productDetails.size}</span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-400 block uppercase font-black tracking-widest">Pattern</span>
                            <span className="text-[14px] font-bold text-gray-800">{productDetails.pattern}</span>
                        </div>
                        <div className="space-y-0.5">
                            <span className="text-[10px] text-gray-400 block uppercase font-black tracking-widest">Year</span>
                            <span className="text-[14px] font-bold text-gray-800">{productDetails.year}</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {/* Quantity */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest ml-0.5">Order Quantity</label>
                            <input
                                required
                                type="number"
                                min="1"
                                className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#FFB82B] transition-all text-base font-medium shadow-sm"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>

                        {/* Comment */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-700 uppercase tracking-widest ml-0.5">Notes / Comments</label>
                            <textarea
                                rows={4}
                                placeholder="Any special requests or questions?"
                                className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-[#FFB82B] transition-all text-base resize-none shadow-sm"
                                value={formData.comment}
                                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                            />
                        </div>

                        {/* Checkbox */}
                        <div className="py-2">
                            <label className="flex items-center gap-4 cursor-pointer group select-none">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="h-6 w-6 cursor-pointer accent-[#FFB82B] rounded-md border-gray-300 transition-all"
                                        checked={formData.notifyStock}
                                        onChange={(e) => setFormData({ ...formData, notifyStock: e.target.checked })}
                                    />
                                </div>
                                <span className="text-[15px] font-bold text-gray-700 group-hover:text-black transition-colors">
                                    Notify me when this product is back in stock
                                </span>
                            </label>
                        </div>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-6">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-4.5 px-10 bg-[#FFB82B] hover:bg-[#EAA71D] text-black font-black rounded-lg transition-all text-sm uppercase tracking-widest shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-h-[56px]"
                        >
                            {isSubmitting ? (
                                <div className="w-6 h-6 border-3 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                "SUBMIT ENQUIRY"
                            )}
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full py-4 text-center text-xs font-black text-gray-400 hover:text-gray-900 uppercase tracking-widest transition-colors mt-2"
                    >
                        Close Panel
                    </button>
                </form>
            </div>
        </Drawer>
    );
}
