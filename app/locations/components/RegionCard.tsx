"use client";

import React from "react";
import { MapPin } from "lucide-react";
import styles from "../locations.module.css";
import { useTranslation } from "@/hooks/useTranslation";

interface RegionCardProps {
    title: string;
    address: string;
    mapLink: string;
}

const RegionCard: React.FC<RegionCardProps> = ({ title, address, mapLink }) => {
    const { t, isRtl } = useTranslation();
    return (
        <div className={`border border-gray-100 bg-white p-6 sm:p-8 md:p-10 flex flex-col justify-between transition-all duration-300 min-h-[320px] group ${styles.fadeIn} ${styles.shadow_premium}`} dir={isRtl ? "rtl" : "ltr"}>
            <div>
                <h2 className="text-h3-sm font-semibold mb-4 text-black uppercase tracking-tight pb-1 w-fit border-b-2 border-primary/20">{title}</h2>
                <div className="text-body leading-[1.6] text-black/80 space-y-2 mb-6 whitespace-pre-line font-medium">
                    {address}
                </div>
            </div>
            <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-body font-semibold text-black group-hover:text-primary transition-all w-fit"
            >
                <div className="bg-black text-white p-2 rounded-full group-hover:bg-primary group-hover:text-black transition-all shadow-md group-hover:rotate-[15deg] transform">
                    <MapPin className="w-3.5 h-3.5" />
                </div>
                <span className="border-b border-transparent group-hover:border-primary transition-all tracking-tight uppercase">{t("locations.googleMap")}</span>
            </a>
        </div>
    );
};

export default RegionCard;
