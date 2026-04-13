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

const SearchPopup: React.FC<SearchPopupProps> = ({ isOpen, onClose }) => {
    const { t, isRtl } = useTranslation();
    const router = useRouter();
    const lp = useLocalePath();
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);


    const handleSearch = (e?: React.FormEvent, term?: string) => {
        if (e) e.preventDefault();
        const searchVal = term || query;
        if (!searchVal.trim()) return;

        router.push(lp(`/products?search=${encodeURIComponent(searchVal.trim())}`));
        onClose();
        setQuery("");
        setSuggestions([]);
    };

    // debounced search
    React.useEffect(() => {
        if (query.length < 2) {
            setSuggestions([]);
            return;
        }

        const abortController = new AbortController();
        const handler = setTimeout(async () => {
            setIsSearching(true);
            try {
                const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                const res = await fetch(`/api/kleverapi/quick-order/search?query=${encodeURIComponent(query)}&pageSize=8`, {
                    headers: token ? { "Authorization": `Bearer ${token}` } : {},
                    signal: abortController.signal,
                });

                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.items || []);
                }
            } catch (err: any) {
                if (err.name !== "AbortError") console.error("Search error:", err);
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


                <div className="flex flex-col gap-6">
                    <form onSubmit={(e) => handleSearch(e)} className="flex items-stretch gap-0 bg-white border-2 border-[#f5b21a] rounded-2xl overflow-hidden shadow-sm h-14 md:h-16 transition-all relative z-20 flex-shrink-0">
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

                    {/* Suggestions Area - Integrated into flow */}
                    {(suggestions.length > 0 || isSearching) && (
                        <div className="bg-gray-50/50 border border-gray-100 rounded-2xl max-h-[400px] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95 duration-200">
                            {isSearching && suggestions.length === 0 && (
                                <div className="p-12 text-center text-gray-400 text-sm flex items-center justify-center gap-3">
                                    <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                    {t("products.loading") || "Searching..."}
                                </div>
                            )}
                            {suggestions.map((item) => (
                                <div
                                    key={item.sku}
                                    onClick={() => handleSearch(undefined, item.sku)}
                                    className="px-8 py-4 hover:bg-white hover:shadow-sm cursor-pointer border-b border-gray-50 last:border-0 flex flex-col gap-1 group transition-all"
                                >
                                    <span className="text-[15px] font-black text-black uppercase tracking-tight group-hover:text-[#f5b21a] transition-colors">{item.sku} {item.item_code ? `(${item.item_code})` : ""}</span>
                                    {item.name && <span className="text-xs text-gray-400 font-medium truncate">{item.name}</span>}
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
