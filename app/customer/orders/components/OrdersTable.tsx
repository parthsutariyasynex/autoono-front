"use client";

import React from "react";

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
        <div className="w-full overflow-x-auto">
            <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                    <tr className="bg-[#f5a623] text-black text-[12px] uppercase font-bold tracking-wide">
                        <th className="px-4 py-3 border border-[#e6950f]/30 font-bold">Order #</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30 font-bold">SAP Order Number</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30 font-bold whitespace-nowrap">Date</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30 font-bold whitespace-nowrap text-right">Grand Total</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30 font-bold text-center">Ordered By</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30 font-bold text-center">Status</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30 font-bold text-center">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.length > 0 ? (
                        orders.map((order, idx) => (
                            <tr
                                key={order.id + idx}
                                className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors"
                            >
                                <td className="px-4 py-3 border-r border-gray-200 text-gray-800 font-medium">
                                    {order.id}
                                </td>
                                <td className="px-4 py-3 border-r border-gray-200 text-gray-500">
                                    {order.sapOrderNumber}
                                </td>
                                <td className="px-4 py-3 border-r border-gray-200 text-gray-500 whitespace-nowrap text-center">
                                    {order.date}
                                </td>
                                <td className="px-4 py-3 border-r border-gray-200 text-gray-800 whitespace-nowrap text-right">
                                    {order.grandTotal}
                                </td>
                                <td className="px-4 py-3 border-r border-gray-200 text-gray-500 text-center">
                                    {order.orderedBy}
                                </td>
                                <td className="px-4 py-3 border-r border-gray-200 text-gray-500 text-center">
                                    {order.status}
                                </td>
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                    <div className="flex items-center justify-center gap-3 text-[12px]">
                                        <button className="text-gray-700 hover:text-black hover:underline underline-offset-2">
                                            View Order
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button className="text-gray-700 hover:text-black hover:underline underline-offset-2">
                                            Reorder
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={7} className="px-4 py-10 text-center text-gray-400 italic">
                                We couldn&apos;t find any records.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default OrdersTable;
