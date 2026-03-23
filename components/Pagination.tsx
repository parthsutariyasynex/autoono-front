"use client";

import React from "react";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
}) => {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between py-6 px-1 gap-6 mt-4">
            {/* Item count */}
            <div className="text-[14px] text-gray-500 font-medium">
                Showing <span className="text-black font-bold">Items {startItem} to {endItem}</span> of <span className="text-black font-bold">{totalItems}</span> total
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-2">
                {pages.map((p) => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`w-10 h-10 flex items-center justify-center text-[14px] rounded-full border transition-all duration-200 ${currentPage === p
                            ? "bg-[#f5a623] border-[#f5a623] text-black font-bold shadow-lg"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-[#f5a623] hover:text-[#f5a623]"
                            }`}
                    >
                        {p}
                    </button>
                ))}

                {currentPage < totalPages && (
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        className="h-10 px-5 flex items-center justify-center text-[13px] bg-white border border-gray-200 text-black font-bold rounded-full hover:bg-gray-50 hover:border-[#f5a623] hover:text-[#f5a623] transition-all duration-200 uppercase"
                    >
                        Next
                    </button>
                )}
            </div>

            {/* Page Size Selector */}
            {onPageSizeChange && (
                <div className="flex items-center gap-3">
                    <span className="text-[14px] text-gray-500 font-medium">Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="h-10 px-3 bg-white border border-gray-200 text-[14px] font-bold focus:outline-none focus:border-[#f5a623] rounded-md cursor-pointer"
                    >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                    <span className="text-[14px] text-gray-500 font-medium whitespace-nowrap">per page</span>
                </div>
            )}
        </div>
    );
};

export default Pagination;
