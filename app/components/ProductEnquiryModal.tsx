"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";
import { formatPrice } from "@/utils/helpers";
import { toast } from "react-hot-toast";
import { getSession } from "next-auth/react";

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

    if (!isOpen) return null;



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validations
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
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-lg shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* HEADER */}
                <div className="bg-[#FFB82B] py-3.5 flex items-center justify-center relative flex-shrink-0">
                    <h2 className="text-[18px] font-bold text-black uppercase tracking-tight">Product Enquiry</h2>
                    <button
                        onClick={onClose}
                        className="absolute right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white text-black hover:bg-gray-100 transition-colors shadow-sm"
                    >
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-5 font-sans overflow-y-auto">
                    {/* Product Name (Read only) */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Product Name</label>
                        <div className="text-[16px] text-black font-semibold leading-snug bg-gray-50 p-3 rounded-md border border-gray-100">
                            {productName}
                        </div>
                    </div>

                    {/* Derived Details Display (Optional but nice for UX) */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-md border border-gray-100">
                        <div>
                            <span className="text-[11px] text-gray-500 block uppercase font-bold">Brand</span>
                            <span className="text-[14px] font-medium text-black">{productDetails.brand}</span>
                        </div>
                        <div>
                            <span className="text-[11px] text-gray-500 block uppercase font-bold">Size</span>
                            <span className="text-[14px] font-medium text-black">{productDetails.size}</span>
                        </div>
                        <div>
                            <span className="text-[11px] text-gray-500 block uppercase font-bold">Pattern</span>
                            <span className="text-[14px] font-medium text-black">{productDetails.pattern}</span>
                        </div>
                        <div>
                            <span className="text-[11px] text-gray-500 block uppercase font-bold">Year</span>
                            <span className="text-[14px] font-medium text-black">{productDetails.year}</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5">
                        {/* Quantity */}
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity</label>
                            <input
                                required
                                type="number"
                                min="1"
                                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#FFB82B] transition-all text-base"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Comment (Optional)</label>
                        <textarea
                            rows={3}
                            placeholder="Add your message here..."
                            className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-[#FFB82B] transition-all text-base resize-none"
                            value={formData.comment}
                            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                        />
                    </div>

                    {/* Checkbox */}
                    <div className="py-2">
                        <label className="flex items-center gap-3 cursor-pointer group select-none">
                            <input
                                type="checkbox"
                                className="h-5 w-5 cursor-pointer accent-[#FFB82B] rounded border-gray-300"
                                checked={formData.notifyStock}
                                onChange={(e) => setFormData({ ...formData, notifyStock: e.target.checked })}
                            />
                            <span className="text-[15px] font-medium text-gray-700">
                                Notify me when this product is back in stock
                            </span>
                        </label>
                    </div>

                    {/* SUBMIT BUTTON */}
                    <div className="pt-2 flex justify-center">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full md:w-auto px-16 py-3.5 bg-[#FFB82B] hover:bg-[#EAA71D] text-black font-black rounded-md transition-all text-sm uppercase tracking-widest shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[200px]"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                "SUBMIT INQUIRY"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
