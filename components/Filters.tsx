"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

interface FiltersProps {
    status: string;
    search: string;
    onStatusChange: (status: string) => void;
    onSearchChange: (search: string) => void;
    onApplySearch: () => void;
    onReset: () => void;
    isFiltered?: boolean;
    statusCounts?: Record<string, number>;
}

const Filters: React.FC<FiltersProps> = ({
    status,
    search,
    onStatusChange,
    onSearchChange,
    onApplySearch,
    onReset,
    isFiltered = false,
    statusCounts = {},
}) => {
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const [isOrderOpen, setIsOrderOpen] = useState(false);

    const [statusOptions, setStatusOptions] = useState<any[]>(["All"]);
    const [orderOptions, setOrderOptions] = useState<any[]>(["All"]);

    const statusRef = useRef<HTMLDivElement>(null);
    const orderRef = useRef<HTMLDivElement>(null);

    // Fetch dynamic filter options
    useEffect(() => {
        async function fetchFilterOptions() {
            try {
                const res = await fetch("/api/kleverapi/my-orders/filter-options", {
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const data = await res.json();

                // Handle FilterByStatus
                let fetchedStatusOptions: any[] = [];
                const statusData = data["Filter By Status"] || data.FilterByStatus || data.status_options || data.statuses || data.status || data;
                if (Array.isArray(statusData)) {
                    fetchedStatusOptions = statusData;
                } else if (statusData && typeof statusData === 'object' && Array.isArray(statusData.items)) {
                    fetchedStatusOptions = statusData.items;
                }

                if (fetchedStatusOptions.length > 0) {
                    const hasAll = fetchedStatusOptions.some(opt => {
                        const label = typeof opt === 'string' ? opt : (opt.label || opt.name || opt.status || "");
                        return label.toLowerCase() === "all";
                    });

                    const finalStatusOptions = hasAll ? fetchedStatusOptions : ["All", ...fetchedStatusOptions];
                    setStatusOptions(finalStatusOptions);
                }

                // Handle FilterByOrder
                let fetchedOrderOptions: any[] = [];
                const orderData = data["Filter By Order"] || data.FilterByOrder || data.order_options || data.orders || data.order;
                if (Array.isArray(orderData)) {
                    fetchedOrderOptions = orderData;
                } else if (orderData && typeof orderData === 'object' && Array.isArray(orderData.items)) {
                    fetchedOrderOptions = orderData.items;
                }

                if (fetchedOrderOptions.length > 0) {
                    const hasAll = fetchedOrderOptions.some(opt => {
                        const label = typeof opt === 'string' ? opt : (opt.label || opt.name || opt.increment_id || "");
                        return label.toLowerCase() === "all";
                    });

                    const finalOrderOptions = hasAll ? fetchedOrderOptions : ["All", ...fetchedOrderOptions];
                    setOrderOptions(finalOrderOptions);
                }
            } catch (error) {
                console.error("Failed to fetch order filter options:", error);
                setStatusOptions(["All", "Check Pending"]);
            }
        }
        fetchFilterOptions();
    }, []);

    // Close dropdowns on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (statusRef.current && !statusRef.current.contains(e.target as Node)) {
                setIsStatusOpen(false);
            }
            if (orderRef.current && !orderRef.current.contains(e.target as Node)) {
                setIsOrderOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const selectedStatusLabel = useMemo(() => {
        const found = statusOptions.find(opt => {
            const val = typeof opt === 'string' ? opt : (opt.value || opt.id || opt.label || opt.status || "");
            return val === status;
        });
        if (!found) return status || "All";
        return typeof found === 'string' ? found : (found.label || found.name || status || "All");
    }, [status, statusOptions]);

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-8 mt-2 overflow-visible">
            <div className="flex flex-col md:flex-row gap-6 items-end">
                {/* Status Dropdown */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-[14px] font-bold text-black uppercase tracking-tight">
                        Filter By Status
                    </label>
                    <div className="relative" ref={statusRef}>
                        <button
                            type="button"
                            onClick={() => {
                                setIsStatusOpen(!isStatusOpen);
                                setIsOrderOpen(false);
                            }}
                            className="h-[42px] min-w-[180px] px-3 bg-[#f5a623] text-black text-[13px] font-bold flex items-center justify-between cursor-pointer focus:outline-none rounded-[1px]"
                        >
                            <span>{selectedStatusLabel}</span>
                            <svg className={`w-3.5 h-3.5 transition-transform duration-200 ${isStatusOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {isStatusOpen && (
                            <ul className="absolute top-full left-0 min-w-[180px] w-full bg-[#f5a623] z-[100] shadow-md max-h-[320px] overflow-y-auto border-t border-black/10">
                                {statusOptions.map((opt: any, idx: number) => {
                                    const optionLabel = typeof opt === 'string' ? opt : (opt.label || opt.name || opt.status || String(idx));
                                    const optionValue = typeof opt === 'string' ? opt : (opt.value || opt.id || optionLabel);

                                    const valForCount = optionValue.toLowerCase();
                                    const count = statusCounts[valForCount] ?? statusCounts[optionValue] ?? 0;

                                    return (
                                        <li key={`${optionLabel}-${idx}`}>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    onStatusChange(optionValue);
                                                    setIsStatusOpen(false);
                                                }}
                                                className={`w-full text-left px-4 py-2 text-[14px] text-black hover:bg-[#1a73e8] hover:text-white transition-colors flex justify-between items-center ${status === optionValue ? "bg-[#1a73e8] text-white font-bold" : ""}`}
                                            >
                                                <span>{optionLabel}</span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Search By Order # (Text Input) */}
                <div className="flex-1 min-w-[220px]">
                    <label className="block text-[14px] font-bold text-black mb-1.5 uppercase tracking-tight">
                        Filter By Order
                    </label>
                    <input
                        type="text"
                        value={search === "All" ? "" : search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                onApplySearch();
                            }
                        }}
                        placeholder="e.g. 000001"
                        className="w-full h-[42px] px-3 bg-[#f8f8f8] border border-gray-200 text-[14px] text-gray-700 focus:outline-none focus:border-[#f5a623] transition-colors rounded-[1px]"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2.5">
                    <button
                        onClick={onApplySearch}
                        className="h-[42px] px-8 bg-black text-white text-[13px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-[1px]"
                    >
                        SEARCH
                    </button>
                    <button
                        onClick={onReset}
                        className="h-[42px] px-8 bg-black text-white text-[13px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-[1px]"
                    >
                        RESET
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Filters;
