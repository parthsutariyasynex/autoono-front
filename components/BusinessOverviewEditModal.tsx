"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api/api-client";
import toast from "react-hot-toast";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface BusinessOverviewData {
    total_employees: string;
    trucks: string;
    annual_revenue: string;
    business_model: string;
    products_offered: string;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    initialData: any;
    onSuccess: () => void;
}

export default function BusinessOverviewEditModal({ isOpen, onClose, initialData, onSuccess }: Props) {
    useLockBodyScroll(isOpen);

    const [formData, setFormData] = useState<BusinessOverviewData>({
        total_employees: "",
        trucks: "",
        annual_revenue: "",
        business_model: "",
        products_offered: "",
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                total_employees: initialData.total_employees || "",
                trucks: initialData.trucks || "",
                annual_revenue: initialData.annual_revenue || "",
                business_model: initialData.business_model || "",
                products_offered: initialData.products_offered || "",
            });
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Updating business overview...");

        try {
            // Note: Sending exactly the fields shown in the UI/Image
            await api.put("/kleverapi/business-overview", formData);

            toast.success("Business overview updated successfully", { id: toastId });
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error("Save Error:", error);
            toast.error("Something went wrong", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass = "w-full border border-gray-200 px-4 py-3 text-body-lg focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all rounded-sm bg-white font-medium text-black placeholder:text-black/50";
    const labelClass = "block text-body-sm font-bold text-black mb-1.5 uppercase tracking-wider";

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-xl shadow-2xl rounded-sm overflow-hidden transform animate-in slide-in-from-bottom-8 duration-300">
                {/* Header */}
                <div className="bg-[#fcfcfc] px-8 py-5 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="text-[18px] font-black text-black uppercase tracking-widest border-b-2 border-primary pb-1">
                        Edit Business Overview
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-black/50 hover:text-black transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className={labelClass}>Total Employee</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.total_employees}
                                onChange={(e) => setFormData({ ...formData, total_employees: e.target.value })}
                                placeholder="e.g. 501"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Total Trucks</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.trucks}
                                onChange={(e) => setFormData({ ...formData, trucks: e.target.value })}
                                placeholder="e.g. 100"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Annual Revenue</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.annual_revenue}
                                onChange={(e) => setFormData({ ...formData, annual_revenue: e.target.value })}
                                placeholder="e.g. 5000000"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Business Model</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.business_model}
                                onChange={(e) => setFormData({ ...formData, business_model: e.target.value })}
                                placeholder="e.g. B2B"
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Products/Services Offered</label>
                            <input
                                type="text"
                                className={inputClass}
                                value={formData.products_offered}
                                onChange={(e) => setFormData({ ...formData, products_offered: e.target.value })}
                                placeholder="e.g. Tyres and Wheels"
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-[#fcfcfc] px-8 py-5 border-t border-gray-100 flex justify-end gap-4">
                    {/* <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-6 py-2.5 text-body font-bold text-black/60 hover:text-black uppercase transition-all tracking-widest"
                    >
                        Cancel
                    </button> */}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-primary hover:bg-black hover:text-white text-black text-body font-bold px-10 py-2.5 uppercase transition-all shadow-lg shadow-primary/10 tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSaving ? "Saving..." : "Save"}
                    </button>
                </div>
            </div>
        </div>
    );
}
