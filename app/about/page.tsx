"use client";
import { useTranslation } from "@/hooks/useTranslation";

import React from "react";

export default function AboutPage() {
    const { t, isRtl } = useTranslation();
    return (
        <div className="min-h-screen bg-white">

            {/* Banner Section */}
            <div className="w-full h-[300px] md:h-[400px] lg:h-[500px]">
                <img
                    src="/images/about-tyresonline-uae.jpg"
                    alt="Al-Talayi Warehouse"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Content Section */}
            <div className="max-w-[1200px] mx-auto px-6 mt-8 sm:mt-12 md:mt-20 pb-20" dir={isRtl ? "rtl" : "ltr"}>
                <h1 className="text-[22px] sm:text-[26px] md:text-[32px] font-black text-center mb-16 tracking-wide text-black uppercase">
                    {t("about.title")}
                </h1>

                <div className={`flex flex-col gap-10 text-black font-semibold text-[14px] sm:text-[15px] md:text-[16px] leading-[1.8] max-w-[1000px] mx-auto ${isRtl ? 'text-right' : 'text-center md:text-left'}`}>
                    <p>{t("about.description")}</p>
                    <p>{t("about.paragraph2")}</p>
                    <p>{t("about.paragraph3")}</p>
                </div>
            </div>
        </div>
    );
}
