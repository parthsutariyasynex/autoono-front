"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, RotateCcw, Search, X } from "lucide-react";
import { api } from "@/lib/api/api-client";
import { useTranslation } from "@/hooks/useTranslation";

interface Option {
    value: string;
    label: string;
}

interface HorizontalFilterProps {
    onSearch: (width: string, height: string, rim: string) => void;
    initialValues?: { width: string; height: string; rim: string };
    vertical?: boolean;
}

/**
 * Custom Searchable Dropdown Component
 */
interface SearchableDropdownProps {
    label: string;
    placeholder: string;
    options: Option[];
    value: string;
    onChange: (value: string) => void;
    loading?: boolean;
    disabled?: boolean;
    emptyMessage?: string;
    direction?: "up" | "down";
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
    label,
    placeholder,
    options,
    value,
    onChange,
    loading,
    disabled,
    emptyMessage = "No options found",
    direction = "down"
}) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const triggerRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

    const updatePosition = useCallback(() => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
    }, []);

    // Keep position updated on scroll/resize while open
    useEffect(() => {
        if (!isOpen) return;
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen, updatePosition]);

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

    const displayLabel = useMemo(() => {
        if (!value) return placeholder;
        const selected = options.find(o => o.value === value);
        return selected ? selected.label : placeholder;
    }, [value, options, placeholder]);

    // Calculate position BEFORE opening so portal renders at correct spot immediately
    const handleToggle = useCallback(() => {
        if (disabled || loading) return;
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
        setIsOpen(prev => !prev);
    }, [disabled, loading, isOpen]);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const renderDropdownList = () => (
        <>
            <div className="px-3 sm:px-4 py-2 bg-[#f5a623] border-b border-yellow-600/20">
                <span className="text-[12px] sm:text-[14px] font-[900] text-black uppercase tracking-tight">
                    {label.replace(" Options", "")}
                </span>
            </div>

            <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-white">
                <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={t("m.search")}
                        className="w-full pl-8 pr-8 py-1.5 text-[12px] sm:text-[14px] bg-gray-50 border border-gray-200 rounded outline-none focus:ring-1 focus:ring-[#f5a623] focus:border-[#f5a623] transition-all"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-[#f5a623] text-gray-400"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white py-1">
                {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => (
                        <div
                            key={opt.value}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange(opt.value);
                                setIsOpen(false);
                                setSearchTerm("");
                            }}
                            className={`px-3 sm:px-4 py-2.5 sm:py-3 text-[12px] sm:text-[14px] font-bold cursor-pointer transition-colors ${value === opt.value
                                ? "bg-yellow-50 text-black border-l-4 border-[#f5a623]"
                                : "text-gray-700 hover:bg-gray-50 hover:text-black"
                                }`}
                        >
                            {opt.label}
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-6 text-center text-[12px] text-gray-500 font-medium italic">
                        {emptyMessage}
                    </div>
                )}
            </div>
        </>
    );

    return (
        <div className="relative">
            <div
                ref={triggerRef}
                onClick={handleToggle}
                className={`flex items-center justify-between px-3 sm:px-4 py-2.5 w-full bg-white border rounded cursor-pointer transition-all h-full ${disabled ? "bg-gray-50 border-gray-200 cursor-not-allowed text-gray-400" :
                    loading ? "border-[#f5a623] bg-yellow-50 cursor-wait text-gray-800" :
                        "border-gray-300 hover:border-[#f5a623] text-gray-800"
                    } ${isOpen ? "ring-2 ring-[#f5a623]/20 border-[#f5a623]" : ""}`}
            >
                <span className="text-[12px] sm:text-[14px] font-bold truncate">
                    {loading ? "Loading..." : displayLabel}
                </span>
                <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-1 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </div>

            {isOpen && mounted && createPortal(
                <>
                    {/* Invisible backdrop to catch outside clicks */}
                    <div
                        className="fixed inset-0"
                        style={{ zIndex: 9998 }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(false);
                            setSearchTerm("");
                        }}
                    />
                    <div
                        ref={dropdownRef}
                        onClick={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        style={{
                            position: "fixed",
                            top: direction === "up" ? "auto" : pos.top,
                            bottom: direction === "up" ? (window.innerHeight - (triggerRef.current?.getBoundingClientRect().top ?? 0) + 4) : "auto",
                            left: pos.left,
                            width: pos.width || "auto",
                            minWidth: 200,
                            zIndex: 9999,
                        }}
                        className="bg-white border border-gray-200 rounded max-h-[300px] sm:max-h-[400px] flex flex-col overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
                    >
                        {renderDropdownList()}
                    </div>
                </>,
                document.body
            )}
        </div>
    );
};

const Skeleton = ({ className }: { className?: string }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
);

const HorizontalFilter: React.FC<HorizontalFilterProps> = ({ onSearch, initialValues, vertical = false }) => {
    const { t } = useTranslation();
    const [widthList, setWidthList] = useState<Option[]>([]);
    const [heightList, setHeightList] = useState<Option[]>([]);
    const [rimList, setRimList] = useState<Option[]>([]);

    const [width, setWidth] = useState(initialValues?.width || "");
    const [height, setHeight] = useState(initialValues?.height || "");
    const [rim, setRim] = useState(initialValues?.rim || "");

    const [loadingWidth, setLoadingWidth] = useState(false);
    const [loadingHeight, setLoadingHeight] = useState(false);
    const [loadingRim, setLoadingRim] = useState(false);

    const hasInitialized = useRef(false);

    // Sync state with initialValues (important for external resets)
    useEffect(() => {
        if (initialValues) {
            setWidth(initialValues.width || "");
            setHeight(initialValues.height || "");
            setRim(initialValues.rim || "");
        }
    }, [initialValues?.width, initialValues?.height, initialValues?.rim]);

    // Parse items to always use Label as Value (Request from senior dev)
    const parseOptions = (data: any, type: string): Option[] => {
        let rawItems: any[] = [];
        if (Array.isArray(data)) {
            rawItems = data;
        } else if (typeof data === "object" && data !== null) {
            rawItems = data.options || data.items || data.data || data.sizes
                || data.heights || data.height || data.rims || data.rim || data.widths || data.width || [];

            if (rawItems.length === 0) {
                const firstArrayKey = Object.keys(data).find(key => Array.isArray(data[key]));
                if (firstArrayKey) {
                    rawItems = data[firstArrayKey];
                }
            }
        }

        return rawItems
            .map((item: any) => {
                const label = String(item.label ?? item.size ?? item.value ?? (typeof item === 'string' ? item : ""));
                return { value: label, label };
            })
            .filter(opt => opt.label && opt.label !== "undefined" && opt.label !== "None");
    };

    const NONE_OPTION: Option = { value: "None", label: "None" };

    const fetchList = async (
        endpoint: string,
        setter: (list: Option[]) => void,
        loadingSetter: (v: boolean) => void,
        type: string,
        addNoneFallback: boolean = false
    ) => {
        if (!endpoint) return;
        loadingSetter(true);
        try {
            const data = await api.get(endpoint);
            const options = parseOptions(data, type);
            if (options.length === 0 && addNoneFallback) {
                setter([NONE_OPTION]);
            } else {
                setter(options);
            }
        } catch (err) {
            console.error(`[HorizontalFilter] ${endpoint} error:`, err);
            setter(addNoneFallback ? [NONE_OPTION] : []);
        } finally {
            loadingSetter(false);
        }
    };

    // 1. Initial Load
    useEffect(() => {
        fetchList("/tyre-size/width", setWidthList, setLoadingWidth, "Width");
        fetchList("/tyre-size/height", setHeightList, setLoadingHeight, "Heights");
        fetchList("/tyre-size/rim", setRimList, setLoadingRim, "Rims");
    }, []);

    // 2. Cascade Height — add "None" fallback if API returns empty
    useEffect(() => {
        if (!hasInitialized.current) return;
        if (width) {
            fetchList(`/tyre-size/height?width=${width}`, setHeightList, setLoadingHeight, "Height", true);
            setHeight("");
            setRim("");
        } else {
            fetchList("/tyre-size/height", setHeightList, setLoadingHeight, "All Heights");
            setRimList([]);
        }
        onSearch(width, "", "");
    }, [width]);

    // 3. Cascade Rim — if height is "None", fetch rim by width only
    useEffect(() => {
        if (!hasInitialized.current) return;
        if (width && height === "None") {
            // Height is "None" → fetch rims using width only
            fetchList(`/tyre-size/rim?width=${width}`, setRimList, setLoadingRim, "Rim");
        } else if (width && height) {
            fetchList(`/tyre-size/rim?width=${width}&height=${height}`, setRimList, setLoadingRim, "Rim");
        } else if (width) {
            fetchList(`/tyre-size/rim?width=${width}`, setRimList, setLoadingRim, "Rims by width");
        } else {
            fetchList("/tyre-size/rim", setRimList, setLoadingRim, "All Rims");
        }
        if (width && height) setRim("");
        onSearch(width, height === "None" ? "" : height, "");
    }, [width, height]);

    // 4. Rim selected
    useEffect(() => {
        if (hasInitialized.current && rim) {
            onSearch(width, height === "None" ? "" : height, rim);
        }
    }, [rim]);

    useEffect(() => { hasInitialized.current = true; }, []);

    const handleSearchClick = () => onSearch(width, height === "None" ? "" : height, rim);

    const handleReset = () => {
        setWidth("");
        setHeight("");
        setRim("");
        fetchList("/tyre-size/height", setHeightList, setLoadingHeight, "All Heights");
        fetchList("/tyre-size/rim", setRimList, setLoadingRim, "All Rims");
        onSearch("", "", "");
    };

    if (vertical) {
        return (
            <div className="flex flex-col gap-4 w-full overflow-visible">
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("m.width")}</label>
                    <div className="h-[48px]">
                        {loadingWidth ? <Skeleton className="w-full h-full" /> : (
                            <SearchableDropdown label="Width" placeholder={t("m.width")} options={widthList} value={width} onChange={setWidth} loading={loadingWidth} direction="down" />
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("m.height")}</label>
                    <div className="h-[48px]">
                        {loadingHeight ? <Skeleton className="w-full h-full" /> : (
                            <SearchableDropdown label="Height" placeholder={t("m.height")} options={heightList} value={height} onChange={setHeight} loading={loadingHeight} emptyMessage={t("filter.noHeights")} direction="down" />
                        )}
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t("m.rim")}</label>
                    <div className="h-[48px]">
                        {loadingRim ? <Skeleton className="w-full h-full" /> : (
                            <SearchableDropdown label="Rim" placeholder={t("m.rim")} options={rimList} value={rim} onChange={setRim} loading={loadingRim} emptyMessage={t("filter.noRims")} direction="down" />
                        )}
                    </div>
                </div>
                <div className="flex gap-3 mt-2">
                    <button
                        onClick={handleSearchClick}
                        className="flex-1 h-[48px] bg-[#f5a623] hover:bg-black hover:text-white rounded-lg text-black font-[900] italic uppercase text-[13px] tracking-tight active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                        <Search className="w-4 h-4" /> {t("m.search")}
                    </button>
                    {(width || height || rim) && (
                        <button
                            onClick={handleReset}
                            className="h-[48px] w-[48px] rounded-lg border border-gray-300 bg-white text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-300 active:scale-95 flex items-center justify-center cursor-pointer transition-all"
                        >
                            <RotateCcw className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-white h-full px-2 sm:px-4 md:px-6 flex items-center justify-center gap-2 sm:gap-4 flex-nowrap overflow-visible relative">
            {/* Label */}
            <div className="bg-[#f5a623] px-4 md:px-6 py-2 md:py-2.5 rounded shadow-sm flex-shrink-0">
                <span className="text-black font-[900] italic uppercase text-[12px] md:text-[15px] tracking-tight whitespace-nowrap">
                    {t("m.search-by-size")}
                </span>
            </div>

            <div className="flex-1 min-w-[80px] max-w-[200px] h-[40px] md:h-[45px]">
                {loadingWidth ? <Skeleton className="w-full h-full" /> : (
                    <SearchableDropdown label="Width" placeholder={t("m.width")} options={widthList} value={width} onChange={setWidth} loading={loadingWidth} direction="up" />
                )}
            </div>

            <div className="flex-1 min-w-[80px] max-w-[200px] h-[40px] md:h-[45px]">
                {loadingHeight ? <Skeleton className="w-full h-full" /> : (
                    <SearchableDropdown label="Height" placeholder={t("m.height")} options={heightList} value={height} onChange={setHeight} loading={loadingHeight} emptyMessage={t("filter.noHeights")} direction="up" />
                )}
            </div>

            <div className="flex-1 min-w-[80px] max-w-[200px] h-[40px] md:h-[45px]">
                {loadingRim ? <Skeleton className="w-full h-full" /> : (
                    <SearchableDropdown label="Rim" placeholder={t("m.rim")} options={rimList} value={rim} onChange={setRim} loading={loadingRim} emptyMessage={t("filter.noRims")} direction="up" />
                )}
            </div>

            <button
                onClick={handleSearchClick}
                className="bg-[#f5a623] hover:bg-black hover:text-white px-4 sm:px-6 md:px-10 py-2 md:py-2.5 h-[40px] md:h-[45px] rounded border-none shadow-sm transition-all text-black font-[900] italic uppercase text-[12px] md:text-[15px] tracking-tight active:scale-95 cursor-pointer flex-shrink-0 flex items-center justify-center"
            >
                {t("m.search")}
            </button>

            <div className="w-[40px] md:w-[45px] h-[40px] md:h-[45px] flex-shrink-0">
                {(width || height || rim) && (
                    <button
                        onClick={handleReset}
                        className="w-full h-full rounded border border-gray-300 bg-white text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-300 transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                        title="Clear filter"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );
};


export default HorizontalFilter;
