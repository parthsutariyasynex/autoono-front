"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { formatPrice } from "@/utils/helpers";
import { toast } from "react-hot-toast";

interface InquiryModalProps {
    product: any;
    isOpen: boolean;
    onClose: () => void;
}

export default function InquiryModal({ product, isOpen, onClose }: InquiryModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        message: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !product) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Mock API call
        try {
            // In a real app, you would POST to /api/inquiry
            await new Promise((resolve) => setTimeout(resolve, 1000));
            toast.success("Inquiry sent successfully!");
            onClose();
        } catch (error) {
            toast.error("Failed to send inquiry. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">Product Inquiry</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-200 transition-colors text-gray-500"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Product Summary */}
                    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 mb-2">
                        <div className="flex gap-4">
                            {product.image_url && (
                                <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-20 h-20 object-cover rounded-lg border bg-white shadow-sm"
                                />
                            )}
                            <div className="flex-1">
                                <h3 className="font-bold text-gray-900 text-lg mb-2">{product.name || "Product Inquiry"}</h3>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Brand</p>
                                        <p className="text-xs font-bold text-gray-700">{product?.name ? product.name.split(' ')[0] : "N/A"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Size</p>
                                        <p className="text-xs font-bold text-gray-700">{product.tyre_size}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Pattern</p>
                                        <p className="text-xs font-bold text-gray-700">{product.pattern || "N/A"}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Price</p>
                                        <p className="text-sm font-black text-yellow-600">{formatPrice(product.final_price || product.price)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-0.5">Full Name</label>
                            <input
                                required
                                type="text"
                                placeholder="Enter your full name"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white outline-none transition-all text-sm"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-0.5">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="example@mail.com"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white outline-none transition-all text-sm"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-0.5">Mobile Number</label>
                                <input
                                    required
                                    type="tel"
                                    placeholder="+966 5X XXX XXXX"
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white outline-none transition-all text-sm"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-1.5 ml-0.5">Your Message</label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Write your inquiry details here..."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 bg-white outline-none transition-all text-sm resize-none"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3.5 px-4 rounded-lg border border-gray-300 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] py-3.5 px-6 bg-yellow-400 hover:bg-yellow-500 text-black font-black rounded-lg transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-widest text-xs"
                        >
                            {isSubmitting ? (
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <Send size={16} strokeWidth={3} />
                                    Submit Inquiry
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
