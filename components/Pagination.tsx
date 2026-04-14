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

export function PageSizeSelect({ value, onChange }: { value: number; onChange: (v: number) => void }) {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0, height: 0 });
    const sizes = [10, 20, 50, 100];

    useEffect(() => { setMounted(true); }, []);

    const updatePos = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPos({ top: rect.top, left: rect.left, width: rect.width, height: rect.height });
        }
    }, []);

    useEffect(() => {
        const handleClose = () => setIsOpen(false);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsOpen(false);
        };

        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
            window.addEventListener('scroll', handleClose, { passive: true });
            window.addEventListener('resize', handleClose);
            return () => {
                window.removeEventListener("keydown", handleKeyDown);
                window.removeEventListener('scroll', handleClose);
                window.removeEventListener('resize', handleClose);
            };
        }
    }, [isOpen]);

    const handleToggle = () => {
        setIsOpen(prev => {
            if (!prev) updatePos();
            return !prev;
        });
    };

    return (
        <div className="flex items-center gap-2 md:gap-3">
            <span className="text-[10px] md:text-[11px] text-gray-400 font-black uppercase tracking-wider">{t("favorites.show")}</span>
            <button
                ref={triggerRef}
                type="button"
                onClick={handleToggle}
                className={`h-8 md:h-9 px-3 bg-white border rounded text-[12px] md:text-[13px] font-black text-black flex items-center gap-2 min-w-[60px] justify-between cursor-pointer transition-all shadow-sm ${isOpen ? "border-[#f5a623] ring-1 ring-[#f5a623]/20" : "border-gray-200 hover:border-[#f5a623] hover:shadow-md"}`}
            >
                {value}
                <ChevronDown size={12} className={`text-[#f5a624] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && mounted && createPortal(
                <>
                    <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setIsOpen(false)} />
                    <div
                        ref={dropdownRef}
                        style={{ position: "fixed", top: pos.top + pos.height + 4, left: pos.left, width: Math.max(pos.width, 65), zIndex: 9999 }}
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
            <span className="text-[10px] md:text-[11px] text-gray-400 font-black uppercase tracking-wider whitespace-nowrap">{t("common.perPage")}</span>
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

    const getVisiblePages = () => {
        const delta = 2; // How many pages to show around the current page
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
                range.push(i);
            }
        }

        for (let i of range) {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        }

        return rangeWithDots;
    };

    const visiblePages = getVisiblePages();

    return (
        <div className="flex flex-col md:flex-row items-center justify-between py-3 md:py-4 px-1 gap-4 mt-4 border-t border-gray-100">
            {/* Item count */}
            <div className="text-[13px] md:text-[14px] text-gray-500 font-medium order-2 md:order-1">
                {t("favorites.show")} <span className="text-black font-extrabold">{t("favorites.items")} {startItem} - {endItem}</span> {t("favorites.of")} <span className="text-black font-extrabold">{totalItems}</span> {t("favorites.total")}
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5 md:gap-2 flex-wrap justify-center order-1 md:order-2">
                {currentPage > 1 && (
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        className="h-9 md:h-10 px-3 md:px-5 flex items-center justify-center text-[11px] md:text-[13px] bg-white border border-gray-200 text-black font-extrabold rounded-full hover:bg-gray-50 hover:border-[#f5a623] hover:text-[#f5a623] transition-all duration-200 uppercase cursor-pointer shadow-sm"
                    >
                        {t("common.previous")}
                    </button>
                )}

                {visiblePages.map((p, index) => (
                    p === '...' ? (
                        <span key={`dots-${index}`} className="px-2 text-gray-400 font-bold">...</span>
                    ) : (
                        <button
                            key={p}
                            onClick={() => onPageChange(p as number)}
                            className={`w-9 h-9 md:w-10 md:h-10 flex items-center justify-center text-[13px] md:text-[14px] rounded-full border transition-all duration-200 cursor-pointer ${currentPage === p
                                ? "bg-[#f5a623] border-[#f5a623] text-black font-extrabold shadow-md transform scale-105"
                                : "bg-white border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:border-[#f5a623] hover:text-[#f5a623]"
                                }`}
                        >
                            {p}
                        </button>
                    )
                ))}

                {currentPage < totalPages && (
                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        className="h-9 md:h-10 px-3 md:px-5 flex items-center justify-center text-[11px] md:text-[13px] bg-white border border-gray-200 text-black font-extrabold rounded-full hover:bg-gray-50 hover:border-[#f5a623] hover:text-[#f5a623] transition-all duration-200 uppercase cursor-pointer shadow-sm"
                    >
                        {t("common.next")}
                    </button>
                )}
            </div>

            {/* Page Size Selector */}
            {onPageSizeChange && (
                <div className="order-3">
                    <PageSizeSelect value={pageSize} onChange={onPageSizeChange} />
                </div>
            )}
        </div>
    );
};

export default Pagination;
