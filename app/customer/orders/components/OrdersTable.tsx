"use client";

import React from "react";
import Price from "@/app/components/Price";

export interface Order {
    id: string;
    sapOrderNumber: string;
    date: string;
    grandTotal: string;
    orderedBy: string;
    status: string;
}

interface OrdersTableProps {
    orders: Order[];
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders }) => {
    return (
        <div className="w-full">
            {/* Desktop Table */}
            <div className="hidden md:block w-full bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
                <div className="overflow-x-auto">
                    <table className="w-full text-body text-left border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-gray-50/80 text-black text-label font-black uppercase tracking-widest h-[60px] border-b border-[#ebebeb]">
                                <th className="px-6 py-4 ltr:text-left rtl:text-right">Order #</th>
                                <th className="px-6 py-4 ltr:text-left rtl:text-right">SAP Order Number</th>
                                <th className="px-6 py-4 text-center whitespace-nowrap">Date</th>
                                <th className="px-6 py-4 text-right whitespace-nowrap">Grand Total</th>
                                <th className="px-6 py-4 text-center">Ordered By</th>
                                <th className="px-6 py-4 text-center">Status</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {orders.length > 0 ? (
                                orders.map((order, idx) => (
                                    <tr
                                        key={order.id + idx}
                                        className="hover:bg-primary/5 transition-colors group h-[70px]"
                                    >
                                        <td className="px-6 py-4 font-black text-black ltr:text-left rtl:text-right group-hover:text-primary transition-colors">
                                            {order.id}
                                        </td>
                                        <td className="px-6 py-4 text-black/60 font-medium ltr:text-left rtl:text-right">
                                            {order.sapOrderNumber || "—"}
                                        </td>
                                        <td className="px-6 py-4 text-black/50 font-mono text-center">
                                            {order.date}
                                        </td>
                                        <td className="px-6 py-4 text-black font-black text-right whitespace-nowrap">
                                            <Price amount={order.grandTotal} />
                                        </td>
                                        <td className="px-6 py-4 text-black/60 font-bold text-center">
                                            {order.orderedBy}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-3 py-1 rounded-full text-caption font-black uppercase tracking-widest ${order.status?.toLowerCase() === 'complete' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-4 text-label font-black uppercase tracking-wider">
                                                <button className="text-black hover:text-primary transition-colors flex items-center gap-1">
                                                    View
                                                </button>
                                                <span className="text-black/30">|</span>
                                                <button className="text-black hover:text-primary transition-colors flex items-center gap-1">
                                                    Reorder
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-24 text-center">
                                        <p className="text-black/50 text-xs italic tracking-[0.2em] uppercase font-black">
                                            We couldn&apos;t find any records.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {orders.length > 0 ? (
                    orders.map((order, idx) => (
                        <div
                            key={order.id + idx}
                            className="bg-white border border-[#ebebeb] rounded-lg shadow-sm p-4 space-y-3"
                        >
                            {/* Order # + Date */}
                            <div className="flex items-center justify-between">
                                <span className="text-body font-black text-black">
                                    #{order.id}
                                </span>
                                <span className="text-body-sm text-black/60 font-mono">
                                    {order.date}
                                </span>
                            </div>

                            {/* Status */}
                            <div>
                                <span className={`inline-block px-3 py-1 rounded-full text-caption font-black uppercase tracking-widest ${order.status?.toLowerCase() === 'complete' ? 'bg-green-100 text-green-700' : 'bg-primary/10 text-primary'}`}>
                                    {order.status}
                                </span>
                            </div>

                            {/* SAP Order Number */}
                            {order.sapOrderNumber && (
                                <div className="flex justify-between text-body-sm">
                                    <span className="text-black/50 uppercase tracking-wider font-bold">SAP Order</span>
                                    <span className="text-black/70 font-medium">{order.sapOrderNumber}</span>
                                </div>
                            )}

                            {/* Ordered By */}
                            {order.orderedBy && (
                                <div className="flex justify-between text-body-sm">
                                    <span className="text-black/50 uppercase tracking-wider font-bold">Ordered By</span>
                                    <span className="text-black/70 font-medium">{order.orderedBy}</span>
                                </div>
                            )}

                            {/* Grand Total */}
                            <div className="flex justify-between text-body-sm">
                                <span className="text-black/50 uppercase tracking-wider font-bold">Grand Total</span>
                                <span className="text-black font-black">
                                    <Price amount={order.grandTotal} />
                                </span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-label font-black uppercase tracking-wider">
                                <button className="text-black hover:text-primary transition-colors">
                                    View
                                </button>
                                <span className="text-black/30">|</span>
                                <button className="text-black hover:text-primary transition-colors">
                                    Reorder
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-white border border-[#ebebeb] rounded-lg px-4 py-16 text-center">
                        <p className="text-black/50 text-xs italic tracking-[0.2em] uppercase font-black">
                            We couldn&apos;t find any records.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersTable;
