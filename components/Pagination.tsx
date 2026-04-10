"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (pageSize: number) => void;
}

function PageSizeSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const sizes = [10, 20, 50, 100];

    useEffect(() => { setMounted(true); }, []);

    const updatePos = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPos({ top: rect.top, left: rect.left, width: rect.width });
        }
    }, []);

    const handleToggle = () => {
        if (!isOpen) updatePos();
        setIsOpen(prev => !prev);
    };

    return (
        <div className="flex items-center gap-2 md:gap-3">
            <span className="text-[12px] md:text-[14px] text-gray-500 font-medium">{t("favorites.show")}</span>
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                className={`h-9 md:h-10 px-3 bg-white border rounded-md text-[13px] md:text-[14px] font-bold text-black flex items-center gap-2 min-w-[65px] justify-between cursor-pointer transition-all shadow-sm ${isOpen ? "border-[#f5a623]" : "border-gray-200 hover:border-gray-300"}`}
            >
                {value}
                <ChevronDown size={13} className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && mounted && createPortal(
                <>
                    <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setIsOpen(false)} />
                    <div
                        ref={dropdownRef}
                        style={{ position: "fixed", bottom: window.innerHeight - pos.top + 4, left: pos.left, width: Math.max(pos.width, 65), zIndex: 9999 }}
                        className="bg-white border border-gray-200 rounded-md shadow-xl overflow-hidden"
                    >
                        {sizes.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => { onChange(s); setIsOpen(false); }}
                                className={`w-full text-center px-3 py-2.5 text-[13px] font-bold cursor-pointer transition-colors border-b last:border-0 border-gray-50 ${s === value ? "bg-[#f5a623] text-black" : "text-gray-700 hover:bg-gray-50 hover:text-[#f5a623]"}`}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </>,
                document.body
            )}
            <span className="text-[12px] md:text-[14px] text-gray-500 font-medium whitespace-nowrap">{t("common.perPage")}</span>
        </div>
    );
}

const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
}) => {
    const { t } = useTranslation();
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
        <div className="flex flex-col md:flex-row items-center justify-between py-4 md:py-6 px-1 gap-4 md:gap-6 mt-4">
            {/* Item count */}
            <div className="text-[12px] md:text-[14px] text-gray-500 font-medium">
                {t("favorites.show")} <span className="text-black font-bold">{t("favorites.items")} {startItem} - {endItem}</span> {t("favorites.of")} <span className="text-black font-bold">{totalItems}</span> {t("favorites.total")}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-center">
                {pages.map((p) => (
                    <button
                        key={p}
                        onClick={() => onPageChange(p)}
                        className={`w-8 h-8 md:w-10 md:h-10 flex items-center justify-center text-[12px] md:text-[14px] rounded-full border transition-all duration-200 cursor-pointer ${currentPage === p
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
                        className="h-8 md:h-10 px-3 md:px-5 flex items-center justify-center text-[11px] md:text-[13px] bg-white border border-gray-200 text-black font-bold rounded-full hover:bg-gray-50 hover:border-[#f5a623] hover:text-[#f5a623] transition-all duration-200 uppercase cursor-pointer"
                    >
                        {t("common.next")}
                    </button>
                )}
            </div>

            {/* Page Size Selector */}
            {onPageSizeChange && (
                <PageSizeSelect value={pageSize} onChange={onPageSizeChange} />
            )}
        </div>
    );
};

export default Pagination;
