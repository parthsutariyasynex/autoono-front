"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { ChevronDown, ChevronLeft, Filter, X } from "lucide-react";

export interface FilterOption {
    value: string;
    label: string;
    count: number;
}

export interface FilterGroupData {
    code: string;
    label: string;
    options: FilterOption[];
}

export default function SidebarFilter({
    categoryId = "5",
    selectedFilters = {},
    onFilterChange
}: {
    categoryId?: string;
    selectedFilters?: Record<string, string[]>;
    onFilterChange?: (filters: Record<string, string[]>, filterLabels: Record<string, { value: string; label: string }[]>) => void;
}) {
    const [filterGroups, setFilterGroups] = useState<FilterGroupData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const filtersRef = useRef(selectedFilters);
    filtersRef.current = selectedFilters;

    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const fetchFilters = async () => {
            try {
                setLoading(true);
                setError(null);

                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                const headers: Record<string, string> = {
                    'Content-Type': 'application/json'
                };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`/api/filters?categoryId=${categoryId}`, {
                    headers,
                    cache: 'no-store'
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || errData.error || `Failed to load filters (${res.status})`);
                }

                const data = await res.json();
                const fetchedFilters = data.filters || [];
                setFilterGroups(fetchedFilters);

                if (fetchedFilters.length > 0) {
                    const initialExpanded: Record<string, boolean> = {};
                    fetchedFilters.slice(0, 3).forEach((group: FilterGroupData) => {
                        initialExpanded[group.code] = true;
                    });
                    setExpandedGroups(prev => Object.keys(prev).length === 0 ? initialExpanded : prev);
                }
            } catch (err: any) {
                console.error("Filter fetch error:", err);
                setError(err.message || "Could not load filters");
            } finally {
                setLoading(false);
            }
        };

        fetchFilters();
    }, [categoryId]);

    const toggleGroup = (code: string) => {
        setExpandedGroups((prev) => ({
            ...prev,
            [code]: !prev[code],
        }));
    };

    const handleCheckboxChange = useCallback((code: string, value: string, checked: boolean) => {
        const prev = filtersRef.current;
        const currentValues = prev[code] || [];
        let newValues: string[];

        if (checked) {
            newValues = currentValues.includes(value)
                ? currentValues
                : [...currentValues, value];
        } else {
            newValues = currentValues.filter((v) => v !== value);
        }

        const nextState = { ...prev, [code]: newValues };
        if (newValues.length === 0) {
            delete nextState[code];
        }

        const nextLabels: Record<string, { value: string; label: string }[]> = {};
        Object.entries(nextState).forEach(([c, vals]) => {
            const group = filterGroups.find((g) => g.code === c);
            if (group) {
                nextLabels[c] = vals.map(v => {
                    const opt = group.options.find(o => o.value === v);
                    return { value: v, label: opt ? opt.label : v };
                });
            }
        });

        onFilterChange?.(nextState, nextLabels);
    }, [onFilterChange, filterGroups]);

    const REDUCED_GROUPS = [
        "Item Code",
        "Promotions and Offers",
        "Year",
        "Origin",
        "Types"
    ];

    const isAnyFilterSelected = Object.keys(selectedFilters).length > 0;

    const visibleFilterGroups = !isAnyFilterSelected
        ? filterGroups
        : filterGroups.filter(g => {
            const label = g.label.toLowerCase();
            return REDUCED_GROUPS.some(rg => {
                const target = rg.toLowerCase();
                // 1. Direct match (case insensitive)
                if (label === target) return true;
                // 2. Special handling for "Promotions and Offers" - matching variations
                if (target === "promotions and offers") {
                    return label.includes("promotion") || label.includes("offer") || label.includes("pormotion");
                }
                // 3. Special handling for "Item Code" - matching common SKU/Code labels
                if (target === "item code") {
                    return label.includes("item code") || label.includes("item_code") || label === "sku";
                }
                return false;
            });
        });

    // Flatten selected filters for chips
    const selectedChips = Object.entries(selectedFilters).flatMap(([code, values]) => {
        const group = filterGroups.find(g => g.code === code);
        return values.map(val => {
            const opt = group?.options.find(o => o.value === val);
            return {
                code,
                value: val,
                label: opt ? opt.label : val
            };
        });
    });

    const removeFilter = (code: string, value: string) => {
        handleCheckboxChange(code, value, false);
    };

    const clearFilters = () => {
        onFilterChange?.({}, {});
    };

    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <aside className={`${isCollapsed ? "w-[50px]" : "w-[300px]"} flex-shrink-0 bg-white border-r border-gray-200 h-[calc(100vh-64px)] overflow-hidden flex flex-col sticky top-16 z-20 transition-all duration-300 ease-in-out`}>
            {/* Sidebar Header */}
            <div className="flex border-b border-gray-200 h-[60px] flex-shrink-0">
                {!isCollapsed && (
                    <div className="flex-1 px-6 flex items-center overflow-hidden whitespace-nowrap">
                        <h2 className="font-bold text-gray-900 text-[16px]">
                            Filter Options
                        </h2>
                    </div>
                )}
                <div
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className={`${isCollapsed ? "w-full" : "w-[50px]"} flex items-center justify-center bg-gray-50 border-l border-gray-200 cursor-pointer hover:bg-gray-100 transition-colors`}
                >
                    <ChevronLeft className={`w-[18px] h-[18px] text-gray-500 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
                </div>
            </div>

            {!isCollapsed && (
                <>
                    {/* Selected Filter Area (Screenshot Matched: Grey background, White Chips) */}
                    {isAnyFilterSelected && (
                        <div className="bg-[#f2f2f2] px-6 py-6 border-b border-gray-200 relative animate-in fade-in duration-300">
                            <div className="flex flex-wrap gap-2 mb-10">
                                {selectedChips.map((chip, idx) => (
                                    <div
                                        key={`${chip.code}-${chip.value}-${idx}`}
                                        className="flex items-center gap-1.5 bg-white border border-gray-200 px-4 py-2 rounded-full text-[13px] font-semibold text-gray-700 shadow-sm"
                                    >
                                        <span className="truncate max-w-[150px]">{chip.label}</span>
                                        <button
                                            onClick={() => removeFilter(chip.code, chip.value)}
                                            className="hover:text-red-500 text-gray-400 transition-colors"
                                        >
                                            <X className="w-3.5 h-3.5" strokeWidth={2.5} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={clearFilters}
                                className="absolute bottom-5 right-6 text-[15px] font-bold text-gray-900 hover:text-black transition-all"
                            >
                                Clear All
                            </button>
                        </div>
                    )}

                    <div className="flex-1 overflow-y-auto w-full custom-scrollbar bg-white">
                        {loading && (
                            <div className="p-10 flex flex-col gap-3 justify-center items-center">
                                <div className="w-8 h-8 border-[3px] border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-xs font-semibold text-gray-400">Loading Filters...</span>
                            </div>
                        )}

                        {error && (
                            <div className="p-5 m-5 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs font-medium">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col">
                            {!loading && !error && visibleFilterGroups.map((group) => (
                                <FilterGroup
                                    key={group.code}
                                    group={group}
                                    isExpanded={expandedGroups[group.code] || false}
                                    onToggle={() => toggleGroup(group.code)}
                                    selectedValues={selectedFilters[group.code] || []}
                                    onCheckboxChange={handleCheckboxChange}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}

            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
            `}</style>
        </aside>
    );
}

function FilterGroup({
    group,
    isExpanded,
    onToggle,
    selectedValues,
    onCheckboxChange
}: {
    group: FilterGroupData;
    isExpanded: boolean;
    onToggle: () => void;
    selectedValues: string[];
    onCheckboxChange: (code: string, value: string, checked: boolean) => void;
}) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredOptions = group.options.filter(opt =>
        opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const selectedInGroup = selectedValues.length;

    return (
        <div className="border-b border-gray-100 last:border-b-0">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors focus:outline-none focus:bg-gray-50 group-btn cursor-pointer"
                aria-expanded={isExpanded}
            >
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-[15px]">
                        {group.label}
                    </span>
                </div>

                <div className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    <ChevronDown className="w-4 h-4" strokeWidth={2.5} />
                </div>
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[450px] opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-5 flex flex-col gap-3">
                    {group.options.length > 5 && (
                        <div className="relative mb-1">
                            <input
                                type="text"
                                placeholder={`Search ${group.label}...`}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-yellow-400 focus:border-yellow-400 outline-none transition-all"
                            />
                            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    )}

                    <div className="overflow-y-auto max-h-[300px] custom-scrollbar pr-2 flex flex-col gap-2.5">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => {
                                const isChecked = selectedValues.includes(option.value);

                                return (
                                    <label
                                        key={option.value}
                                        className="flex items-center justify-between cursor-pointer group/label"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="relative flex items-center justify-center">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={(e) => onCheckboxChange(group.code, option.value, e.target.checked)}
                                                    className="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded-[3px] checked:bg-yellow-400 checked:border-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:ring-offset-1 transition-all cursor-pointer"
                                                />
                                                <svg className="absolute w-3 h-3 text-black pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" viewBox="0 0 14 10" fill="none">
                                                    <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                            <span className={`text-[13px] transition-colors leading-tight ${isChecked ? 'text-black font-bold' : 'text-gray-600 font-medium group-hover/label:text-black'}`}>
                                                {option.label}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 group-hover/label:bg-gray-100 transition-colors">
                                            {option.count}
                                        </span>
                                    </label>
                                );
                            })
                        ) : (
                            <div className="text-[11px] text-gray-400 italic py-2 text-center">No matches found</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}