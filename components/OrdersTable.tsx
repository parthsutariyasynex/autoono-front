"use client";
import React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import Price from "@/app/components/Price";

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
    const { t } = useTranslation();
    return (
        <div className="w-full">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-[13px] text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-[#f5a623] text-black text-[12px] uppercase font-bold tracking-wide">
                            <th className="px-2 lg:px-4 py-3 border border-[#e6950f]/30">{t("orders.orderId")}</th>
                            <th className="px-2 lg:px-4 py-3 border border-[#e6950f]/30">{t("orders.sapOrder")}</th>
                            <th className="px-2 lg:px-4 py-3 border border-[#e6950f]/30 whitespace-nowrap text-center">{t("orders.date")}</th>
                            <th className="px-2 lg:px-4 py-3 border border-[#e6950f]/30 whitespace-nowrap text-right">{t("orders.grandTotal")}</th>
                            <th className="px-2 lg:px-4 py-3 border border-[#e6950f]/30 text-center">{t("orders.orderedBy")}</th>
                            <th className="px-2 lg:px-4 py-3 border border-[#e6950f]/30 text-center">{t("orders.status")}</th>
                            <th className="px-2 lg:px-4 py-3 border border-[#e6950f]/30 text-center">{t("orders.action")}</th>
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
                                        className="px-2 lg:px-4 py-3 border-r border-gray-200 text-gray-800 font-medium cursor-pointer"
                                        onClick={() => onViewOrder(order.entity_id)}
                                    >
                                        {order.id}
                                    </td>
                                    <td className="px-2 lg:px-4 py-3 border-r border-gray-200 text-gray-500">
                                        {order.sapOrderNumber}
                                    </td>
                                    <td className="px-2 lg:px-4 py-3 border-r border-gray-200 text-gray-500 whitespace-nowrap text-center">
                                        {order.date}
                                    </td>
                                    <td className="px-2 lg:px-4 py-3 border-r border-gray-200 text-gray-800 whitespace-nowrap text-right price currency-riyal">
                                        <Price amount={order.grandTotal} />
                                    </td>

                                    <td className="px-2 lg:px-4 py-3 border-r border-gray-200 text-gray-500 text-center">
                                        {order.orderedBy}
                                    </td>
                                    <td className="px-2 lg:px-4 py-3 border-r border-gray-200 text-gray-500 text-center">
                                        {t(`data.${order.status}`) !== `data.${order.status}` ? t(`data.${order.status}`) : order.status}
                                    </td>
                                    <td className="px-2 lg:px-4 py-3 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-3 text-[12px]">
                                            <button
                                                onClick={() => onViewOrder(order.entity_id)}
                                                className="text-gray-700 hover:text-[#f5a623] hover:underline underline-offset-2 transition-colors"
                                            >
                                                {t("orders.viewOrder")}
                                            </button>
                                            <span className="text-gray-300">|</span>
                                            <button
                                                onClick={() => onReorder(order)}
                                                className="text-gray-700 hover:text-[#f5a623] hover:underline underline-offset-2 transition-colors"
                                            >
                                                {t("orders.reorder")}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={7} className="px-4 py-10 text-center text-gray-400 italic">
                                    {t("orders.noRecords")}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {orders.length > 0 ? (
                    orders.map((order, idx) => (
                        <div
                            key={order.increment_id + idx}
                            className="border border-gray-200 rounded-lg bg-white p-4 space-y-3"
                        >
                            {/* Order number + Date */}
                            <div className="flex items-center justify-between">
                                <span
                                    className="text-[13px] font-medium text-gray-800 cursor-pointer"
                                    onClick={() => onViewOrder(order.entity_id)}
                                >
                                    #{order.id}
                                </span>
                                <span className="text-[12px] text-gray-500">{order.date}</span>
                            </div>

                            {/* Status badge */}
                            <div>
                                <span className="inline-block text-[11px] uppercase font-semibold tracking-wide bg-[#f5a623]/15 text-[#b37a00] px-2.5 py-1 rounded-full">
                                    {t(`data.${order.status}`) !== `data.${order.status}` ? t(`data.${order.status}`) : order.status}
                                </span>
                            </div>

                            {/* SAP Order Number */}
                            {order.sapOrderNumber && (
                                <div className="flex justify-between text-[12px]">
                                    <span className="text-gray-400">{t("orders.sapOrder")}</span>
                                    <span className="text-gray-600">{order.sapOrderNumber}</span>
                                </div>
                            )}

                            {/* Ordered By (Ship To) */}
                            <div className="flex justify-between text-[12px]">
                                <span className="text-gray-400">{t("orders.shipTo")}</span>
                                <span className="text-gray-600">{order.orderedBy}</span>
                            </div>

                            {/* Order Total */}
                            <div className="flex justify-between text-[12px]">
                                <span className="text-gray-400">{t("orders.orderTotal")}</span>
                                <span className="text-gray-800 font-medium price currency-riyal"><Price amount={order.grandTotal} /></span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-3 pt-2 border-t border-gray-100 text-[12px]">
                                <button
                                    onClick={() => onViewOrder(order.entity_id)}
                                    className="text-[#f5a623] font-medium hover:underline underline-offset-2 transition-colors"
                                >
                                    {t("orders.viewOrder")}
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={() => onReorder(order)}
                                    className="text-gray-700 hover:text-[#f5a623] hover:underline underline-offset-2 transition-colors"
                                >
                                    {t("orders.reorder")}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-10 text-center text-gray-400 italic">
                        {t("orders.noRecords")}
                    </div>
                )}
            </div>
        </div>
    );
};

export default OrdersTable;
