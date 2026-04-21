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
    is_paid?: boolean;
}

interface OrdersTableProps {
    orders: Order[];
    onViewOrder: (id: string) => void;
    onReorder: (order: Order) => void;
    onMakePayment?: (order: Order) => void;
}

const OrdersTable: React.FC<OrdersTableProps> = ({ orders, onViewOrder, onReorder, onMakePayment }) => {
    const { t } = useTranslation();
    return (
        <div className="w-full font-rubik">
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-body text-left border-collapse min-w-[700px]">
                    <thead>
                        <tr className="bg-primary text-black text-label uppercase font-bold tracking-widest">
                            <th className="px-2 lg:px-4 py-4 border border-[#e6950f]/30">{t("orders.orderId")}</th>
                            <th className="px-2 lg:px-4 py-4 border border-[#e6950f]/30">{t("orders.sapOrder")}</th>
                            <th className="px-2 lg:px-4 py-4 border border-[#e6950f]/30 whitespace-nowrap text-center">{t("orders.date")}</th>
                            <th className="px-2 lg:px-4 py-4 border border-[#e6950f]/30 whitespace-nowrap text-right">{t("orders.grandTotal")}</th>
                            <th className="px-2 lg:px-4 py-4 border border-[#e6950f]/30 text-center">{t("orders.orderedBy")}</th>
                            <th className="px-2 lg:px-4 py-4 border border-[#e6950f]/30 text-center">{t("orders.status")}</th>
                            <th className="px-2 lg:px-4 py-4 border border-[#e6950f]/30 text-center">{t("orders.action")}</th>
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
                                        className="px-2 lg:px-4 py-4 border-r border-gray-200 text-gray-800 text-body-lg font-bold cursor-pointer"
                                        onClick={() => onViewOrder(order.entity_id)}
                                    >
                                        {order.id}
                                    </td>
                                    <td className="px-2 lg:px-4 py-4 border-r border-gray-200 text-gray-600 text-body">
                                        {order.sapOrderNumber}
                                    </td>
                                    <td className="px-2 lg:px-4 py-4 border-r border-gray-200 text-gray-600 text-body whitespace-nowrap text-center">
                                        {order.date}
                                    </td>
                                    <td className="px-2 lg:px-4 py-4 border-r border-gray-200 text-black text-body-lg font-bold whitespace-nowrap text-right price currency-riyal">
                                        <Price amount={order.grandTotal} />
                                    </td>

                                    <td className="px-2 lg:px-4 py-4 border-r border-gray-200 text-gray-600 text-body text-center">
                                        {order.orderedBy}
                                    </td>
                                    <td className="px-2 lg:px-4 py-3 border-r border-gray-200 text-center">
                                        <span className={`inline-flex px-2 py-1 border rounded-sm text-caption font-bold uppercase tracking-wider bg-white whitespace-nowrap ${order.status?.toLowerCase().includes('pending') ? 'border-[#ccc] text-black' :
                                            order.status?.toLowerCase().includes('complete') ? 'border-green-200 text-green-700 bg-green-50' :
                                                order.status?.toLowerCase().includes('cancel') ? 'border-red-200 text-red-700 bg-red-50' :
                                                    'border-gray-200 text-gray-700 bg-white'
                                            }`}>
                                            {t(`data.${order.status}`) !== `data.${order.status}` ? t(`data.${order.status}`) : order.status}
                                        </span>
                                    </td>
                                    <td className="px-2 lg:px-4 py-4 whitespace-nowrap text-center">
                                        <div className="flex items-center justify-center gap-2.5 text-body-sm font-bold uppercase tracking-wide">
                                            <button
                                                onClick={() => onViewOrder(order.entity_id)}
                                                className="text-gray-500 hover:text-black transition-colors"
                                            >
                                                {t("orders.viewOrder")}
                                            </button>
                                            <span className="text-gray-300 font-normal">|</span>
                                            <button
                                                onClick={() => onReorder(order)}
                                                className="text-gray-500 hover:text-black transition-colors"
                                            >
                                                {t("orders.reorder")}
                                            </button>
                                            <span className="text-gray-300 font-normal">|</span>
                                            {order.is_paid ? (
                                                <button
                                                    onClick={() => onViewOrder(order.entity_id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-[2px] font-bold transition-colors shadow-sm"
                                                >
                                                    View Payment
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => onMakePayment?.(order)}
                                                    className="bg-primary hover:bg-primaryHover text-white px-4 py-1.5 rounded-[2px] font-bold transition-colors shadow-sm"
                                                >
                                                    {t("orders.makePayment") === "orders.makePayment" ? "Make Payment" : t("orders.makePayment")}
                                                </button>
                                            )}
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
                                    className="text-body font-medium text-gray-800 cursor-pointer"
                                    onClick={() => onViewOrder(order.entity_id)}
                                >
                                    #{order.id}
                                </span>
                                <span className="text-body-sm text-gray-500">{order.date}</span>
                            </div>

                            {/* Status badge */}
                            <div>
                                <span className={`inline-block px-2.5 py-1 border rounded-sm text-caption font-bold uppercase tracking-wider bg-white ${order.status?.toLowerCase().includes('pending') ? 'border-[#ccc] text-black' :
                                    order.status?.toLowerCase().includes('complete') ? 'border-green-200 text-green-700 bg-green-50' :
                                        order.status?.toLowerCase().includes('cancel') ? 'border-red-200 text-red-700 bg-red-50' :
                                            'border-gray-300 text-gray-700 bg-white'
                                    }`}>
                                    {t(`data.${order.status}`) !== `data.${order.status}` ? t(`data.${order.status}`) : order.status}
                                </span>
                            </div>

                            {/* SAP Order Number */}
                            {order.sapOrderNumber && (
                                <div className="flex justify-between text-body-sm">
                                    <span className="text-gray-400">{t("orders.sapOrder")}</span>
                                    <span className="text-gray-600">{order.sapOrderNumber}</span>
                                </div>
                            )}

                            {/* Ordered By (Ship To) */}
                            <div className="flex justify-between text-body-sm">
                                <span className="text-gray-400">{t("orders.shipTo")}</span>
                                <span className="text-gray-600">{order.orderedBy}</span>
                            </div>

                            {/* Order Total */}
                            <div className="flex justify-between text-body-sm">
                                <span className="text-gray-400">{t("orders.orderTotal")}</span>
                                <span className="text-gray-800 font-medium price currency-riyal"><Price amount={order.grandTotal} /></span>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2.5 pt-2 border-t border-gray-100 text-body-sm">
                                <button
                                    onClick={() => onViewOrder(order.entity_id)}
                                    className="text-gray-600 font-medium"
                                >
                                    {t("orders.viewOrder")}
                                </button>
                                <span className="text-gray-300">|</span>
                                <button
                                    onClick={() => onReorder(order)}
                                    className="text-gray-600 font-medium"
                                >
                                    {t("orders.reorder")}
                                </button>
                                <span className="text-gray-300">|</span>
                                {order.is_paid ? (
                                    <button
                                        onClick={() => onViewOrder(order.entity_id)}
                                        className="bg-green-600 text-white px-3 py-1 rounded-[2px] font-bold"
                                    >
                                        View Payment
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onMakePayment?.(order)}
                                        className="bg-primary text-white px-3 py-1 rounded-[2px] font-bold"
                                    >
                                        {t("orders.makePayment") === "orders.makePayment" ? "Make Payment" : t("orders.makePayment")}
                                    </button>
                                )}
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
