"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { api } from "@/lib/api/api-client";

interface Option {
    value: string;
    label: string;
}

interface HorizontalFilterProps {
    onSearch: (width: string, height: string, rim: string) => void;
    initialValues?: { width: string; height: string; rim: string };
}

const HorizontalFilter: React.FC<HorizontalFilterProps> = ({ onSearch, initialValues }) => {
    const [widthList, setWidthList] = useState<Option[]>([]);
    const [heightList, setHeightList] = useState<Option[]>([]);
    const [rimList, setRimList] = useState<Option[]>([]);

    const [width, setWidth] = useState(initialValues?.width || "");
    const [height, setHeight] = useState(initialValues?.height || "");
    const [rim, setRim] = useState(initialValues?.rim || "");

    const [loading, setLoading] = useState(false);

    // Helper to fetch list and set state
    const fetchList = async (endpoint: string, setter: (list: Option[]) => void) => {
        setLoading(true);
        try {
            // Using the centralized api client for reliability- includes tokens automatically
            const data = await api.get(endpoint);

            // Handle diverse API return formats (Standard Magento, Nested data, or Flat array)
            const rawItems = Array.isArray(data) ? data :
                (data.items || data.data || data.sizes || data.heights || data.rims || data.widths || []);

            const options = rawItems.map((item: any) => ({
                value: String(item.value || item.size || item),
                label: String(item.label || item.size || item)
            }));
            setter(options);
        } catch (err) {
            console.error("HorizontalFilter fetch error:", err);
            setter([]);
        } finally {
            setLoading(false);
        }
    };

    // Initial Fetch of Widths
    useEffect(() => {
        fetchList("/tyre-size/width", setWidthList);
    }, []);

    // Width Change: Fetch Heights
    useEffect(() => {
        if (width) {
            fetchList(`/tyre-size/height?width=${width}`, setHeightList);
        } else {
            setHeightList([]);
            setRimList([]);
        }
    }, [width]);

    // Height Change: Fetch Rims
    useEffect(() => {
        if (width && height) {
            fetchList(`/tyre-size/rim?width=${width}&height=${height}`, setRimList);
        } else {
            setRimList([]);
        }
    }, [width, height]);

    const handleSearchClick = () => {
        onSearch(width, height, rim);
    };

    return (
        <div className="w-full bg-white py-4 px-6 border-b border-gray-100 flex flex-wrap items-center justify-center gap-3">

            {/* Search by Size Label/Button */}
            <div className="bg-[#f5a623] px-6 py-2.5 rounded shadow-sm">
                <span className="text-black font-[900] italic uppercase text-[15px] tracking-tight">
                    SEARCH BY SIZE
                </span>
            </div>

            {/* Width Dropdown */}
            <div className="relative group">
                <select
                    value={width}
                    onChange={(e) => {
                        setWidth(e.target.value);
                        setHeight("");
                        setRim("");
                    }}
                    className="appearance-none bg-white border border-gray-300 rounded px-4 py-2.5 pr-10 min-w-[140px] text-[15px] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f5a623] transition-all cursor-pointer"
                >
                    <option value="">Width</option>
                    {widthList.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            {/* Height Dropdown */}
            <div className="relative group">
                <select
                    value={height}
                    onChange={(e) => {
                        setHeight(e.target.value);
                        setRim("");
                    }}
                    className="appearance-none bg-white border border-gray-300 rounded px-4 py-2.5 pr-10 min-w-[140px] text-[15px] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f5a623] transition-all cursor-pointer"
                >
                    <option value="">Height</option>
                    {heightList.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            {/* Rim Dropdown */}
            <div className="relative group">
                <select
                    value={rim}
                    onChange={(e) => setRim(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded px-4 py-2.5 pr-10 min-w-[140px] text-[15px] font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#f5a623] transition-all cursor-pointer"
                >
                    <option value="">Rim</option>
                    {rimList.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-gray-600 transition-colors">
                    <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            {/* Search Button */}
            <button
                onClick={handleSearchClick}
                className="bg-[#f5a623] hover:bg-black hover:text-white px-8 py-2.5 rounded shadow-sm transition-all text-black font-[900] italic uppercase text-[15px] tracking-tight ml-2 active:scale-95"
            >
                SEARCH
            </button>
        </div>
    );
};

export default HorizontalFilter;
