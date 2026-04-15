"use client";

import React, { useState } from "react";
import Popup from "./Popup";
import { Search, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useRouter } from "next/navigation";
import { useLocalePath } from "@/hooks/useLocalePath";

interface SearchPopupProps {
    isOpen: boolean;
    onClose: () => void;
}

// Parse tyre size string like "195", "19565", "1956515", "195/65R15", "195/65 R15"
function parseTyreSize(input: string): { width: string; height: string; rim: string } {
    const cleaned = input.replace(/\s+/g, "").toUpperCase();

    // Format: 195/65R15 or 195/65 R 15
    const slashMatch = cleaned.match(/^(\d{3})\/?(\d{2})?R?(\d{2,3})?$/i);
    if (slashMatch) {
        return { width: slashMatch[1] || "", height: slashMatch[2] || "", rim: slashMatch[3] || "" };
    }

    // Pure digits: 195 → width, 19565 → width+height, 1956515 → width+height+rim
    const digits = cleaned.replace(/\D/g, "");
    if (digits.length >= 7) {
        return { width: digits.slice(0, 3), height: digits.slice(3, 5), rim: digits.slice(5) };
    }
    if (digits.length >= 5) {
        return { width: digits.slice(0, 3), height: digits.slice(3, 5), rim: "" };
    }
    if (digits.length >= 3) {
        return { width: digits.slice(0, 3), height: "", rim: "" };
    }

    return { width: digits, height: "", rim: "" };
}

const SearchPopup: React.FC<SearchPopupProps> = ({ isOpen, onClose }) => {
    const { t, isRtl } = useTranslation();
    const router = useRouter();
    const lp = useLocalePath();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<{ label: string; sku: string }[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [noResults, setNoResults] = useState(false);

    const handleSearch = (e?: React.FormEvent, term?: string) => {
        if (e) e.preventDefault();
        const searchVal = term || query;
        if (!searchVal.trim()) return;

        const parsed = parseTyreSize(searchVal.trim());

        // Build URL with width/height/rim params for the products page
        const params = new URLSearchParams();
        if (parsed.width) params.set("width", parsed.width);
        if (parsed.height) params.set("height", parsed.height);
        if (parsed.rim) params.set("rim", parsed.rim);

        router.push(lp(`/products?${params.toString()}`));
        onClose();
        setQuery("");
        setSuggestions([]);
    };

    const handleSuggestionClick = (suggestion: { label: string; sku: string }) => {
        const parsed = parseTyreSize(suggestion.label);
        const params = new URLSearchParams();
        if (parsed.width) params.set("width", parsed.width);
        if (parsed.height) params.set("height", parsed.height);
        if (parsed.rim) params.set("rim", parsed.rim);
        if (!parsed.width && suggestion.sku) params.set("search", suggestion.sku);

        router.push(lp(`/products?${params.toString()}`));
        onClose();
        setQuery("");
        setSuggestions([]);
        setNoResults(false);
    };

    // Fetch tyre size suggestions
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
                const res = await fetch(`/api/kleverapi/quick-order/search?query=${encodeURIComponent(query)}&pageSize=20`, {
                    headers: token ? { "Authorization": `Bearer ${token}` } : {},
                    signal: abortController.signal,
                });

                if (res.ok) {
                    const data = await res.json();
                    console.log("[SearchPopup] API Response:", data);
                    const items = data.items || data || [];
                    const results: { label: string; sku: string }[] = [];
                    const seen = new Set<string>();

                    items.forEach((item: any) => {
                        let size = item.tyre_size || item.size || item.color || "";

                        // If no tyre_size field, try to extract size from product name
                        // Matches patterns like: 265/70 R195, 195/65R15, 195 R15, 205/55 R16
                        if (!size && item.name) {
                            const match = item.name.match(/(\d{3}\/?\d{0,2}\s*R\s*\d{2,3})/i);
                            if (match) size = match[1].trim();
                        }

                        if (size && !seen.has(size)) {
                            seen.add(size);
                            results.push({ label: size, sku: item.sku || "" });
                        }
                    });

                    setSuggestions(results);
                    setNoResults(results.length === 0);
                } else {
                    console.error("[SearchPopup] API Error:", res.status);
                    setSuggestions([]);
                    setNoResults(true);
                }
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    console.error("Search error:", err);
                    setSuggestions([]);
                    setNoResults(true);
                }
            } finally {
                if (!abortController.signal.aborted) setIsSearching(false);
            }
        }, 400);

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
                    <X size={16} className="text-gray-900 group-hover:text-white transition-colors" />
                </button>

                <div className="flex flex-col gap-0">
                    {/* Search Input */}
                    <form onSubmit={(e) => handleSearch(e)} className="flex items-stretch gap-0 bg-white border-2 border-[#f5b21a] rounded-xl overflow-hidden shadow-sm h-14 md:h-16 transition-all relative z-20 flex-shrink-0">
                        <input
                            type="text"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t("nav.searchPlaceholder")}
                            className="flex-1 px-6 md:px-10 text-base md:text-lg font-bold text-black outline-none placeholder:text-[#b2b2b2] placeholder:font-medium bg-transparent min-w-0 ltr:text-left rtl:text-right"
                        />
                        <button
                            type="submit"
                            className="bg-[#f5b21a] hover:bg-yellow-500 text-black w-14 md:w-20 flex items-center justify-center transition-all duration-300 cursor-pointer active:scale-95 flex-shrink-0"
                        >
                            <Search size={22} strokeWidth={3} />
                        </button>
                    </form>

                    {/* Suggestions Dropdown */}
                    {(suggestions.length > 0 || isSearching || noResults) && (
                        <div className="bg-white border border-gray-200 border-t-0 rounded-b-xl max-h-[300px] overflow-y-auto shadow-lg">
                            {isSearching && (
                                <div className="p-8 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                </div>
                            )}
                            {!isSearching && noResults && (
                                <div className="px-6 md:px-10 py-6 text-center text-gray-400 text-sm font-medium">
                                    {t("quickOrder.noProducts")}
                                </div>
                            )}
                            {!isSearching && suggestions.map((item, idx) => (
                                <div
                                    key={`${item.sku}-${idx}`}
                                    onClick={() => handleSuggestionClick(item)}
                                    className="px-6 md:px-10 py-3.5 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
                                >
                                    <span className="text-[15px] font-bold text-black">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </Popup>
    );
};

export default SearchPopup;
