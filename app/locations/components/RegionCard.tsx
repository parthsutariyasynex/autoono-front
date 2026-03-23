"use client";

import React from "react";
import { MapPin } from "lucide-react";
import styles from "../locations.module.css";

interface RegionCardProps {
    title: string;
    address: string;
    mapLink: string;
}

const RegionCard: React.FC<RegionCardProps> = ({ title, address, mapLink }) => {
    return (
        <div className={`border border-gray-100 bg-[#fbfbfb] p-10 flex flex-col justify-between transition-all duration-300 min-h-[320px] group ${styles.fadeIn} ${styles.shadow_premium}`}>
            <div>
                <h2 className="text-[19px] font-black mb-6 text-black uppercase tracking-tight border-b-2 border-[#f5a623]/20 pb-2 w-fit">{title}</h2>
                <div className="text-[15px] leading-[1.7] text-gray-800 space-y-2 mb-8 whitespace-pre-line font-medium opacity-90">
                    {address}
                </div>
            </div>
            <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 text-[14px] font-bold text-black group-hover:text-[#f5a623] transition-all w-fit"
            >
                <div className="bg-black text-white p-2.5 rounded-full group-hover:bg-[#f5a623] group-hover:text-black transition-all shadow-md group-hover:rotate-[15deg] transform">
                    <MapPin className="w-4 h-4" />
                </div>
                <span className="border-b-2 border-transparent group-hover:border-[#f5a623] transition-all tracking-tight uppercase">Google Map Location</span>
            </a>
        </div>
    );
};

export default RegionCard;
