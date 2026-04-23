"use client";
import { useTranslation } from "@/hooks/useTranslation";

import React from "react";

export default function UserGuidesPage() {
    const { t, isRtl } = useTranslation();
    return (
        <div className="min-h-screen bg-white">

            {/* Banner Section */}
            <div className="w-full">
                {/* <img
                    src="/images/about-tyresonline-uae.jpg"
                    alt="Al-Talayi Warehouse Banner"
                    className="w-full h-auto object-cover max-h-[500px]"
                /> */}
            </div>

            {/* Content Section */}
            <div className="max-w-[1200px] mx-auto px-6 mt-16 md:mt-20 pb-10 sm:pb-16 md:pb-20" dir={isRtl ? "rtl" : "ltr"}>
                <h1 className="text-h3 sm:text-[26px] md:text-h1 font-black text-center mb-16 tracking-wide text-black uppercase">
                    {t("guides.title")}
                </h1>

                {/* Guides Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 w-full max-w-[1000px] mx-auto">

                    {/* Guide 1 */}
                    {/* <div className="w-full flex justify-center">
                        <div className="w-full border-[2px] border-gray-200 bg-white hover:border-gray-300 transition-colors duration-300 flex flex-col group cursor-pointer shadow-sm">
                            <div className="relative w-full aspect-[16/9] bg-[#1a1a1e] flex items-center justify-center overflow-hidden">
                                <img src="/images/Why-Btire-English.jpg" alt={t("guides.whyBtire")} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform group-hover:scale-110 duration-300">
                                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-md">
                                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full border-t-[2px] border-gray-200 py-4 flex justify-center bg-white">
                                <span className="text-black font-bold text-[15px]">{t("guides.whyBtire")}</span>
                            </div>
                        </div>
                    </div> */}

                    {/* Guide 2 */}
                    {/* <div className="w-full flex justify-center">
                        <div className="w-full border-[2px] border-gray-200 bg-white hover:border-gray-300 transition-colors duration-300 flex flex-col group cursor-pointer shadow-sm">
                            <div className="relative w-full aspect-[16/9] bg-[#1a1a1e] flex items-center justify-center overflow-hidden">
                                <img src="/images/What-is-Btire-English.jpg" alt={t("guides.whatIsBtire")} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform group-hover:scale-110 duration-300">
                                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-md">
                                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full border-t-[2px] border-gray-200 py-4 flex justify-center bg-white">
                                <span className="text-black font-bold text-[15px]">{t("guides.whatIsBtire")}</span>
                            </div>
                        </div>
                    </div>

                    {/* Guide 3 */}
                    {/* <div className="w-full flex justify-center">
                        <div className="w-full border-[2px] border-gray-200 bg-white hover:border-gray-300 transition-colors duration-300 flex flex-col group cursor-pointer shadow-sm">
                            <div className="relative w-full aspect-[16/9] bg-[#1a1a1e] flex items-center justify-center overflow-hidden">
                                <img src="/images/My-account-information-English.jpg" alt={t("guides.myAccountProfile")} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform group-hover:scale-110 duration-300">
                                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-md">
                                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full border-t-[2px] border-gray-200 py-4 flex justify-center bg-white">
                                <span className="text-black font-bold text-[15px]">{t("guides.myAccountProfile")}</span>
                            </div>
                        </div>
                    </div> */}

                    {/* Guide 4 */}
                    {/* <div className="w-full flex justify-center">
                        <div className="w-full border-[2px] border-gray-200 bg-white hover:border-gray-300 transition-colors duration-300 flex flex-col group cursor-pointer shadow-sm">
                            <div className="relative w-full aspect-[16/9] bg-[#1a1a1e] flex items-center justify-center overflow-hidden">
                                <img src="/images/Create-an-order-english.jpg" alt={t("guides.btireOrderCycle")} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none transition-transform group-hover:scale-110 duration-300">
                                    <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-md">
                                        <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full border-t-[2px] border-gray-200 py-4 flex justify-center bg-white">
                                <span className="text-black font-bold text-[15px]">{t("guides.btireOrderCycle")}</span>
                            </div>
                        </div>
                    </div> */}

                </div>
            </div>
        </div>
    );
}
