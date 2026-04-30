"use client";

import React, { useState } from "react";
import Popup from "./Popup";
import { Search, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocalePath } from "@/hooks/useLocalePath";

interface SearchPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

// Parse tyre size string like "195", "19565", "1956515", "195/65R15", "195/65 R15"
function parseTyreSize(input: string): { width: string; height: string; rim: string } | null {
    const cleaned = input.replace(/\s+/g, "").toUpperCase();

    // Stricter pattern: Needs 3 digits for width, optional 2 digits for height, optional R, then 2-3 digits for rim
    // Example: 225/55R17, 225 55 17, 1956515
    const patterns = [
        /^(\d{3})\/(\d{2})R(\d{2,3})$/i,  // 225/55R17
        /^(\d{3})\/(\d{2})(\d{1,2})$/i,   // 225/55 17
        /^(\d{3})(\d{2})R(\d{2})$/i,      // 22555R17
        /^(\d{3})(\d{2})(\d{2})$/i,       // 2256515
    ];

    for (const pattern of patterns) {
        const match = cleaned.match(pattern);
        if (match) {
            return { width: match[1], height: match[2], rim: match[3] };
        }
    }

    // Single width match (must be 3 digits exactly to avoid matching names like 10W40)
    const widthOnlyMatch = cleaned.match(/^(\d{3})$/);
    if (widthOnlyMatch) {
        return { width: widthOnlyMatch[1], height: "", rim: "" };
    }

    return null;
}

const SearchPopup: React.FC<SearchPopupProps> = ({ isOpen, onClose }) => {
    const { t, isRtl } = useTranslation();
    const router = useRouter();
    const lp = useLocalePath();
    const searchParams = useSearchParams();
    const currentStore = searchParams?.get("store") || "";

    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<{ label: string; sku: string }[]>([]);
    const [totalFound, setTotalFound] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [noResults, setNoResults] = useState(false);

    const handleSearch = (e?: React.FormEvent, term?: string) => {
        if (e) e.preventDefault();
        const searchVal = term || query;
        if (!searchVal.trim()) return;

        const parsed = parseTyreSize(searchVal.trim());
        const params = new URLSearchParams();

        if (currentStore) params.set("store", currentStore);

        if (parsed) {
            params.set("width", parsed.width);
            if (parsed.height) params.set("height", parsed.height);
            if (parsed.rim) params.set("rim", parsed.rim);
        } else {
            params.set("search", searchVal.trim());
        }

        router.push(lp(`/products?${params.toString()}`));
        onClose();
        setQuery("");
        setSuggestions([]);
    };

    const handleSuggestionClick = (suggestion: { label: string; sku: string }) => {
        const params = new URLSearchParams();
        if (currentStore) params.set("store", currentStore);

        // Use the 'search' parameter for consistency with the user's requested URL structure.
        // This ensures the products page accurately picks up the search intent.
        params.set("search", suggestion.sku || suggestion.label);

        router.push(lp(`/products?${params.toString()}`));
        onClose();
        setQuery("");
        setSuggestions([]);
        setNoResults(false);
    };

    // Fetch product suggestions
    React.useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            setNoResults(false);
            return;
        }

        const abortController = new AbortController();
        const handler = setTimeout(async () => {
            setIsSearching(true);
            setNoResults(false);
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

                let allItems: any[] = [];
                let page = 1;
                let totalPages = 1;
                const pageSize = 100;
                let finalTotalCount = 0;

                while (page <= totalPages) {
                    const storeParam = currentStore ? `&store=${encodeURIComponent(currentStore)}` : "";
                    const res = await fetch(`/api/kleverapi/product-search?query=${encodeURIComponent(query)}&pageSize=${pageSize}&page=${page}${storeParam}`, {
                        headers: token ? { "Authorization": `Bearer ${token}` } : {},
                        signal: abortController.signal,
                    });

                    if (res.ok) {
                        const data = await res.json();
                        const items = Array.isArray(data) ? data : (data.items || data.products || data.data || []);
                        allItems = [...allItems, ...items];

                        finalTotalCount = typeof data?.total_count === "number" ? data.total_count : Math.max(finalTotalCount, allItems.length);
                        totalPages = data.total_pages || (data.total_count ? Math.ceil(data.total_count / pageSize) : 1);

                        if (items.length < pageSize || page >= totalPages) break;
                    } else {
                        break;
                    }
                    page++;
                    if (page > 10) break; // Hard safety limit
                }

                if (allItems.length > 0) {
                    const results: { label: string; sku: string }[] = [];
                    const seen = new Set<string>();

                    allItems.forEach((item: any) => {
                        const name = (item.name || item.label || item.title || "").toString();
                        const sku = (item.sku || item.product_sku || item.item_code || item.itemCode || "").toString();

                        if (name && !seen.has(sku || name)) {
                            seen.add(sku || name);
                            results.push({ label: name, sku });
                        }
                    });

                    setSuggestions(results);
                    setTotalFound(finalTotalCount);
                    setNoResults(results.length === 0);
                } else {
                    setSuggestions([]);
                    setTotalFound(0);
                    setNoResults(true);
                }
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    setSuggestions([]);
                    setNoResults(true);
                }
            } finally {
                if (!abortController.signal.aborted) setIsSearching(false);
            }
        }, 300);

        return () => {
            clearTimeout(handler);
            abortController.abort();
        };
    }, [query]);

    return (
        <Popup
            isOpen={isOpen}
            onClose={onClose}
            maxWidth="max-w-3xl"
            className="!rounded-2xl overflow-visible h-fit"
            scrollable={false}
            closeOnOverlayClick={false}
        >
            <div className="relative p-6 md:p-10" dir={isRtl ? "rtl" : "ltr"}>
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`absolute -top-3 ${isRtl ? "-left-3" : "-right-3"} w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 hover:border-red-600 transition-all duration-300 z-[1001] cursor-pointer group hover:scale-110 active:scale-90`}
                >
                    <X size={16} className="text-black group-hover:text-white transition-colors" />
                </button>

                <div className="flex flex-col gap-0">
                    {/* Search Input */}
                    <form onSubmit={(e) => handleSearch(e)} className="flex items-stretch gap-0 bg-white border-2 border-primary rounded-xl overflow-hidden shadow-sm h-14 md:h-16 transition-all relative z-20 flex-shrink-0">
                        <input
                            type="text"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("nav.searchPlaceholder")}
                            className="flex-1 px-6 md:px-10 text-base md:text-lg font-bold text-black outline-none placeholder:text-black/40 placeholder:font-medium bg-transparent min-w-0 ltr:text-left rtl:text-right"
                        />
                        <button
                            type="submit"
                            className="bg-primary hover:bg-primary text-black w-14 md:w-20 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 flex-shrink-0"
                        >
                            <Search size={22} strokeWidth={3} />
                        </button>
                    </form>

                    {/* Suggestions Dropdown */}
                    {(suggestions.length > 0 || isSearching || noResults) && (
                        <div className="bg-white border border-gray-200 border-t-0 rounded-b-xl max-h-[300px] overflow-y-auto shadow-lg">
                            {isSearching && (
                                <div className="p-8 text-center text-black/50 text-sm flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {!isSearching && suggestions.length > 0 && (
                                <div className="px-6 md:px-10 py-2 border-b border-gray-100 bg-gray-50/50 text-caption font-bold text-black/40 uppercase tracking-widest">
                                    {t("m.found")} {totalFound} {t("m.products")}
                                </div>
                            )}
                            {!isSearching && noResults && (
                                <div className="px-6 md:px-10 py-6 text-center text-black/50 text-sm font-medium">
                                    {t("quickOrder.noProducts")}
                                </div>
                            )}
                            {!isSearching && suggestions.map((item, idx) => (
                                <div
                                    key={`${item.sku}-${idx}`}
                                    onClick={() => handleSuggestionClick(item)}
                                    className="px-6 md:px-10 py-3.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-[14px] md:text-[15px] font-bold text-black truncate">{item.label}</span>
                                        {item.sku && (
                                            <span className="text-caption text-black/50 font-medium uppercase tracking-wider flex-shrink-0">{item.sku}</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {/* {!isSearching && totalFound > suggestions.length && (
                                <div
                                    onClick={() => handleSearch()}
                                    className="px-6 md:px-10 py-3 hover:bg-primary/10 cursor-pointer bg-gray-50/50 text-center text-caption font-bold text-primary uppercase tracking-widest transition-colors"
                                >
                                    {t("m.view-all")} ({totalFound})
                                </div>
                            )} */}
                        </div>
                    )}
                </div>
            </div>
        </Popup>
    );
};

export default SearchPopup;
