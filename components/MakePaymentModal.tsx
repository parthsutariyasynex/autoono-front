"use client";
import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useLockBodyScroll } from "@/hooks/useLockBodyScroll";

interface MakePaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    order: any;
    customerName: string;
    onSave?: (data: any) => void;
    receivablePayment?: number;
}

const MakePaymentModal: React.FC<MakePaymentModalProps> = ({ isOpen, onClose, order, customerName, onSave, receivablePayment }) => {
    useLockBodyScroll(isOpen);

    const { t, locale } = useTranslation();
    const { data: session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        sap_invoice_no: "",
        payment_date: new Date().toISOString().split("T")[0],
        payment_method: "",
        paid_payment: "",
        remarks: ""
    });

    useEffect(() => {
        if (isOpen && order) {
            setFormData({
                sap_invoice_no: "",
                payment_date: new Date().toISOString().split("T")[0],
                payment_method: "",
                paid_payment: receivablePayment?.toFixed(2) || "",
                remarks: ""
            });
        }
    }, [isOpen, order, receivablePayment]);

    if (!isOpen || !order) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = (session as any)?.accessToken;

        if (!token) {
            toast.error("Please login to submit payment");
            return;
        }

        if (!formData.paid_payment) {
            toast.error("Please enter the paid payment amount");
            return;
        }

        if (!formData.payment_method) {
            toast.error("Please select a payment method");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Submitting payment...");

        try {
            const response = await fetch("/api/kleverapi/payment-history", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    "x-locale": locale,
                },
                body: JSON.stringify({
                    order_id: order.entity_id || order.id,
                    sap_invoice_no: formData.sap_invoice_no,
                    payment_date: formData.payment_date,
                    payment_method: formData.payment_method,
                    paid_payment: formData.paid_payment,
                    remarks: formData.remarks
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to submit payment");
            }

            toast.success("Payment submitted successfully!", { id: toastId });
            onSave?.(result);
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Something went wrong", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white w-full max-w-5xl rounded-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="bg-black text-white px-5 py-3 flex items-center justify-between">
                    <h2 className="text-body-lg font-bold uppercase tracking-wide">{t("orders.makePayment")}</h2>
                    <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Order # */}
                        <div className="space-y-1.5">
                            <label className="text-label font-black text-black/80 uppercase tracking-widest">{t("orders.orderId")}</label>
                            <input
                                type="text"
                                readOnly
                                value={order.id || order.increment_id}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-body text-black/60 outline-none"
                            />
                        </div>

                        {/* Customer Name */}
                        <div className="space-y-1.5">
                            <label className="text-label font-black text-black/80 uppercase tracking-widest">{t("m.customer-name") || "Customer Name"}</label>
                            <input
                                type="text"
                                readOnly
                                value={customerName}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-body text-black/60 outline-none"
                            />
                        </div>

                        {/* Customer Code */}
                        <div className="space-y-1.5">
                            <label className="text-label font-black text-black/80 uppercase tracking-widest">{t("m.customer-code")}</label>
                            <input
                                type="text"
                                readOnly
                                value={order.customer_code || order.customerCode || "AD2404"}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-body text-black/60 outline-none"
                            />
                        </div>

                        {/* SAP Invoice No */}
                        <div className="space-y-1.5">
                            <label className="text-label font-black text-black/80 uppercase tracking-widest">SAP Invoice No</label>
                            <input
                                type="text"
                                value={formData.sap_invoice_no}
                                onChange={(e) => setFormData({ ...formData, sap_invoice_no: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-body text-black outline-none focus:border-black transition-colors"
                            />
                        </div>

                        {/* Payment Date */}
                        <div className="space-y-1.5">
                            <label className="text-label font-black text-black/80 uppercase tracking-widest">Payment Date</label>
                            <input
                                type="date"
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-body text-black outline-none focus:border-black transition-colors cursor-pointer"
                            />
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-1.5">
                            <label className="text-label font-black text-black/80 uppercase tracking-widest">Payment Method</label>
                            <select
                                value={formData.payment_method}
                                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-body text-black outline-none focus:border-black transition-colors"
                            >
                                <option value="">-- Select --</option>
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Check">Check</option>
                                <option value="Cash">Cash</option>
                            </select>
                        </div>

                        {/* Invoice Amount */}
                        <div className="space-y-1.5">
                            <label className="text-label font-black text-black/80 uppercase tracking-widest">Invoice Amount</label>
                            <input
                                type="text"
                                readOnly
                                value={order.grand_total || order.grandTotal || "0.00"}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-body text-black/60 outline-none font-bold"
                            />
                        </div>

                        {/* Receivable Payment */}
                        <div className="space-y-1.5">
                            <label className="text-label font-black text-black/80 uppercase tracking-widest">Receivable Payment</label>
                            <input
                                type="text"
                                readOnly
                                value={receivablePayment?.toFixed(2) || "0.00"}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-body text-black/60 outline-none font-bold"
                            />
                        </div>

                        {/* Paid Payment */}
                        <div className="space-y-1.5">
                            <label className="text-label font-black text-black/80 uppercase tracking-widest">Paid Payment <span className="text-red-500 inline">*</span></label>
                            <input
                                type="number"
                                required
                                value={formData.paid_payment}
                                onChange={(e) => setFormData({ ...formData, paid_payment: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-body text-black outline-none focus:border-black transition-colors"
                            />
                        </div>

                        {/* Remarks */}
                        <div className="space-y-1.5">
                            <label className="text-label font-black text-black/80 uppercase tracking-widest">Remarks</label>
                            <textarea
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                rows={3}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-body text-black outline-none focus:border-black transition-colors resize-none"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 border-t border-gray-100">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-primary hover:bg-primaryHover text-white px-8 py-2.5 rounded-sm font-bold text-body transition-all active:scale-95 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            Submit Payment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MakePaymentModal;
