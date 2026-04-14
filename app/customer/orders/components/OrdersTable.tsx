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
        <div className="w-full bg-white border border-[#ebebeb] rounded-xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
            <div className="overflow-x-auto">
                <table className="w-full text-[13px] text-left border-collapse min-w-[900px]">
                    <thead>
                        <tr className="bg-gray-50/80 text-black text-[11px] font-black uppercase tracking-widest h-[60px] border-b border-[#ebebeb]">
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
                                    className="hover:bg-yellow-50/20 transition-colors group h-[70px]"
                                >
                                    <td className="px-6 py-4 font-black text-black ltr:text-left rtl:text-right group-hover:text-yellow-700 transition-colors">
                                        {order.id}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-medium ltr:text-left rtl:text-right">
                                        {order.sapOrderNumber || "—"}
                                    </td>
                                    <td className="px-6 py-4 text-gray-400 font-mono text-center">
                                        {order.date}
                                    </td>
                                    <td className="px-6 py-4 text-gray-800 font-black text-right whitespace-nowrap">
                                        <Price amount={order.grandTotal} />
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-bold text-center">
                                        {order.orderedBy}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status?.toLowerCase() === 'complete' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-4 text-[11px] font-black uppercase tracking-wider">
                                            <button className="text-gray-800 hover:text-yellow-600 transition-colors flex items-center gap-1">
                                                View
                                            </button>
                                            <span className="text-gray-200">|</span>
                                            <button className="text-gray-800 hover:text-yellow-600 transition-colors flex items-center gap-1">
                                                Reorder
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-6 py-24 text-center">
                                    <p className="text-gray-400 text-xs italic tracking-[0.2em] uppercase font-black">
                                        We couldn&apos;t find any records.
                                    </p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default OrdersTable;
