"use client";

import React from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (count: number) => void;
}

function getPageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: (number | "...")[] = [];

    // Always show first page
    pages.push(1);

    if (current > 3) {
        pages.push("...");
    }

    // Pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    if (current < total - 2) {
        pages.push("...");
    }

    // Always show last page
    pages.push(total);

    return pages;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange,
}) => {
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);
    const pages = getPageNumbers(currentPage, totalPages);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between py-3 px-6 bg-[#f0f0f0] rounded-sm mt-0 border-t border-gray-100">
            {/* Left: Item count */}
            <div className="text-[13px] text-gray-600 font-medium">
                Items {startItem} to {endItem} of {totalItems} total
            </div>

            {/* Center: Page numbers */}
            <div className="flex items-center gap-1.5">
                {pages.map((p, idx) =>
                    p === "..." ? (
                        <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-[13px] text-gray-400">
                            ...
                        </span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p as number)}
                            className={`w-8 h-8 flex items-center justify-center text-[13px] rounded-full transition-all duration-200 ${currentPage === p
                                    ? "bg-[#f5a623] text-black font-bold shadow-sm"
                                    : "bg-white text-gray-700 hover:bg-gray-200 border border-gray-200"
                                }`}
                        >
                            {p}
                        </button>
                    )
                )}
                <button
                    onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
                    className={`w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-gray-200 transition-colors ${currentPage === totalPages ? "opacity-30 cursor-not-allowed" : ""
                        }`}
                    disabled={currentPage === totalPages}
                >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Right: Per page */}
            <div className="flex items-center gap-3">
                <span className="text-[13px] text-gray-600 font-medium">Show</span>
                <div className="relative">
                    <input
                        type="text"
                        value={itemsPerPage}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (val > 0) onItemsPerPageChange(val);
                        }}
                        className="w-[55px] h-[34px] text-center text-[13px] font-bold border border-gray-300 focus:outline-none focus:border-black rounded-[2px] bg-white"
                    />
                </div>
                <span className="text-[13px] text-gray-600 font-bold">per page</span>
            </div>
        </div>
    );
};

export default Pagination;
