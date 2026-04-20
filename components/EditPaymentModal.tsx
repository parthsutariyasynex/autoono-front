"use client";
import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

interface EditPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    payment: any;
    order: any;
    customerName: string;
    onSave?: (data: any) => void;
}

const EditPaymentModal: React.FC<EditPaymentModalProps> = ({ isOpen, onClose, payment, order, customerName, onSave }) => {
    const { t, locale } = useTranslation();
    const { data: session } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        sap_invoice_no: "",
        payment_date: "",
        payment_method: "",
        paid_payment: "",
        receiver_name: "",
        remarks: "",
        comment1: "",
        comment2: "",
        proof: null as File | null
    });

    useEffect(() => {
        if (isOpen && payment) {
            setFormData({
                sap_invoice_no: payment.sap_invoice_no || "",
                payment_date: payment.payment_date ? new Date(payment.payment_date).toISOString().split("T")[0] : "",
                payment_method: payment.payment_method || "Cash",
                paid_payment: payment.paid_payment?.toString() || "",
                receiver_name: payment.receiver_name || "",
                remarks: payment.remarks || "",
                comment1: payment.comment1 || "",
                comment2: payment.comment2 || "",
                proof: null
            });
        }
    }, [isOpen, payment]);

    if (!isOpen || !payment || !order) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, proof: e.target.files[0] });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = (session as any)?.accessToken;

        if (!token) {
            toast.error("Please login to update payment");
            return;
        }

        setIsSubmitting(true);
        const toastId = toast.loading("Updating payment...");

        try {
            // In a real scenario with file upload, you'd use FormData
            // However, the current API expects JSON for fields.
            // If file upload is needed, we'll need to handle it separately or use multipart.
            // For now, updating the fields via JSON.

            const response = await fetch(`/api/kleverapi/payment-history/${payment.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                    "x-locale": locale,
                },
                body: JSON.stringify({
                    id: payment.id,
                    order_id: order.entity_id || order.id,
                    sap_invoice_no: formData.sap_invoice_no,
                    payment_date: formData.payment_date,
                    payment_method: formData.payment_method,
                    paid_payment: formData.paid_payment,
                    receiver_name: formData.receiver_name,
                    remarks: formData.remarks,
                    comment1: formData.comment1,
                    comment2: formData.comment2
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Failed to update payment");
            }

            toast.success("Payment updated successfully!", { id: toastId });
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
                    <h2 className="text-[14px] font-bold uppercase tracking-wide">Edit Payment</h2>
                    <button onClick={onClose} className="hover:opacity-70 transition-opacity">
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="p-6 md:p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8">
                        {/* Receipt No */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Receipt No</label>
                            <input
                                type="text"
                                readOnly
                                value={payment.receipt_no || "N/A"}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-[13px] text-gray-500 outline-none"
                            />
                        </div>

                        {/* Order ID */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Order ID</label>
                            <input
                                type="text"
                                readOnly
                                value={payment.order_increment_id || order.increment_id}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-[13px] text-gray-500 outline-none"
                            />
                        </div>

                        {/* Customer Name */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Customer Name</label>
                            <input
                                type="text"
                                readOnly
                                value={payment.customer_name || customerName}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-[13px] text-gray-500 outline-none"
                            />
                        </div>

                        {/* Customer Code */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">{t("m.customer-code")}</label>
                            <input
                                type="text"
                                readOnly
                                value={payment.customer_code || order.customerCode || "N/A"}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-[13px] text-gray-500 outline-none"
                            />
                        </div>

                        {/* SAP Invoice No */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">SAP Invoice No</label>
                            <input
                                type="text"
                                value={formData.sap_invoice_no}
                                onChange={(e) => setFormData({ ...formData, sap_invoice_no: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-[13px] text-black outline-none focus:border-black transition-colors"
                            />
                        </div>

                        {/* Payment Date */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Payment Date</label>
                            <input
                                type="date"
                                value={formData.payment_date}
                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-[13px] text-black outline-none focus:border-black transition-colors"
                            />
                        </div>

                        {/* Payment Method */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Payment Method</label>
                            <select
                                value={formData.payment_method}
                                onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-[13px] text-black outline-none focus:border-black transition-colors"
                            >
                                <option value="Bank Transfer">Bank Transfer</option>
                                <option value="Cash">Cash</option>
                                <option value="Check">Check</option>
                            </select>
                        </div>

                        {/* Invoice Amount */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Invoice Amount</label>
                            <input
                                type="text"
                                readOnly
                                value={payment.invoice_amount || order.grand_total}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-[13px] text-gray-500 outline-none"
                            />
                        </div>

                        {/* Receivable Payment */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Receivable Payment</label>
                            <input
                                type="text"
                                readOnly
                                value={payment.receivable_payment || order.receivable_payment}
                                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-sm text-[13px] text-gray-500 outline-none"
                            />
                        </div>

                        {/* Paid Payment */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Paid Payment</label>
                            <input
                                type="number"
                                value={formData.paid_payment}
                                onChange={(e) => setFormData({ ...formData, paid_payment: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-[13px] text-black outline-none focus:border-black transition-colors"
                            />
                        </div>

                        {/* Receiver Name */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Receiver Name</label>
                            <input
                                type="text"
                                value={formData.receiver_name}
                                onChange={(e) => setFormData({ ...formData, receiver_name: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-[13px] text-black outline-none focus:border-black transition-colors"
                            />
                        </div>

                        {/* Proof Upload */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Upload Proof (Image/PDF)</label>
                            <div className="flex flex-col gap-1">
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="text-[11px] text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded-sm file:border-0 file:text-[11px] file:font-bold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
                                />
                                <p className="text-[10px] text-gray-400">No proof uploaded yet.</p>
                            </div>
                        </div>

                        {/* Remarks */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Remarks</label>
                            <textarea
                                value={formData.remarks}
                                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-sm text-[13px] text-black outline-none focus:border-black transition-colors resize-none"
                            />
                        </div>

                        {/* Comment 1 */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Comment 1</label>
                            <input
                                type="text"
                                value={formData.comment1}
                                onChange={(e) => setFormData({ ...formData, comment1: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-[13px] text-black outline-none focus:border-black transition-colors"
                            />
                        </div>

                        {/* Comment 2 */}
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-black text-gray-700 uppercase tracking-widest">Comment 2</label>
                            <input
                                type="text"
                                value={formData.comment2}
                                onChange={(e) => setFormData({ ...formData, comment2: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-sm text-[13px] text-black outline-none focus:border-black transition-colors"
                            />
                        </div>
                    </div>

                    <div className="flex justify-start">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-[#1D70B8] hover:bg-[#155a96] text-white px-10 py-3 rounded-sm font-bold text-[14px] transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
                            Save Changes
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditPaymentModal;
