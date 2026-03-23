"use client";

import React from "react";

export interface Order {
    id: string;
    sapOrderNumber: string;
    date: string;
    grandTotal: string;
    orderedBy: string;
    status: string;
    increment_id: string;
    entity_id: string;
}

interface OrdersTableProps {
    orders: Order[];
    onViewOrder: (id: string) => void;
    onReorder: (order: Order) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onViewOrder, onReorder }) => {
    return (
        <div className="w-full overflow-x-auto">
            <table className="w-full text-[13px] text-left border-collapse">
                <thead>
                    <tr className="bg-[#f5a623] text-black text-[12px] uppercase font-bold tracking-wide">
                        <th className="px-4 py-3 border border-[#e6950f]/30">Order #</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30">SAP Order Number</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30 whitespace-nowrap text-center">Date</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30 whitespace-nowrap text-right">Grand Total</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30 text-center">Ordered By</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30 text-center">Status</th>
                        <th className="px-4 py-3 border border-[#e6950f]/30 text-center">Action</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.length > 0 ? (
                        orders.map((order, idx) => (
                            <tr
                                key={order.increment_id + idx}
                                className="border-b border-gray-200 hover:bg-gray-50/50 transition-colors"
                            >
                                <td
                                    className="px-4 py-3 border-r border-gray-200 text-gray-800 font-medium cursor-pointer"
                                    onClick={() => onViewOrder(order.entity_id)}
                                >
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
                                        <button
                                            onClick={() => onViewOrder(order.entity_id)}
                                            className="text-gray-700 hover:text-[#f5a623] hover:underline underline-offset-2 transition-colors"
                                        >
                                            View Order
                                        </button>
                                        <span className="text-gray-300">|</span>
                                        <button
                                            onClick={() => onReorder(order)}
                                            className="text-gray-700 hover:text-[#f5a623] hover:underline underline-offset-2 transition-colors"
                                        >
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
