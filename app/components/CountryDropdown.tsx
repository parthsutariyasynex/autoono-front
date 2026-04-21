"use client";

import React, { useState, useRef, useEffect } from 'react';

export interface Country {
    code: string;
    country: string;
    nativeName: string;
    iso: string;
    flagClass: string;
}

export const COUNTRY_CODES: Country[] = [
    {
        code: "+966",
        country: "Saudi Arabia",
        nativeName: "المملكة العربية السعودية",
        iso: "sa",
        flagClass: "iti__flag iti__sa"
    },
    {
        code: "+91",
        country: "India",
        nativeName: "भारत",
        iso: "in",
        flagClass: "iti__flag iti__in"
    },
    {
        code: "+971",
        country: "United Arab Emirates",
        nativeName: "الإمارات العربية المتحدة",
        iso: "ae",
        flagClass: "iti__flag iti__ae"
    },
];

interface CountryDropdownProps {
    selectedCountryCode: string;
    onSelect: (code: string) => void;
}

const CountryDropdown: React.FC<CountryDropdownProps> = ({ selectedCountryCode, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const selectedCountry = COUNTRY_CODES.find(c => c.code === selectedCountryCode) || COUNTRY_CODES[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative h-full" ref={dropdownRef}>
            <div
                className="px-4 flex items-center gap-2 border-r rtl:border-r-0 rtl:border-l border-gray-100 cursor-pointer min-w-[110px] sm:min-w-[125px] hover:bg-gray-50 transition-colors h-full"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={`${selectedCountry.flagClass}`}></span>
                <span
                    dir="ltr"
                    className="font-semibold text-[15px]"
                    style={{ color: '#e02b27' }}
                >
                    {selectedCountry.code}
                </span>
                <span className="text-[10px] text-black/40 ltr:ml-auto rtl:mr-auto pt-[2px]">▼</span>
            </div>

            {isOpen && (
                <div className="absolute top-[calc(100%+4px)] ltr:left-0 rtl:right-0 w-[400px] max-w-[calc(100vw-32px)] bg-white border border-gray-100 rounded-[2px] shadow-[0_15px_35px_rgba(0,0,0,0.12)] z-[100] max-h-[300px] overflow-y-auto scrollbar-hide">
                    {COUNTRY_CODES.map((item) => (
                        <div
                            key={item.code}
                            onClick={() => {
                                onSelect(item.code);
                                setIsOpen(false);
                            }}
                            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 cursor-pointer border-b last:border-0 border-gray-50 transition-colors group"
                        >
                            <div className="flex items-center gap-4">
                                <span className={`${item.flagClass} scale-110`}></span>
                                <span className="text-body font-semibold text-[#e02b27] group-hover:text-black transition-colors">
                                    {item.country} ({item.nativeName})
                                </span>
                            </div>
                            <span className="text-body font-bold text-black group-hover:text-[#e02b27] transition-colors">
                                {item.code}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CountryDropdown;
