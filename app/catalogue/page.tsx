"use client";
import { useTranslation } from "@/hooks/useTranslation";

import React from "react";

export default function CataloguePage() {
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
            <div className="max-w-[1200px] mx-auto px-6 mt-8 sm:mt-12 md:mt-20 pb-10 sm:pb-16 md:pb-20 flex flex-col items-center" dir={isRtl ? "rtl" : "ltr"}>
                <h1 className="text-h3 sm:text-[26px] md:text-h1 font-black text-center mb-16 tracking-wide text-black uppercase">
                    {t("catalogue.title")}
                </h1>

                {/* Catalogue Cover Document */}
                <div className="w-full flex justify-center mt-4">
                    <a
                        href="https://autoono-demo.btire.com/media/wysiwyg/TBR-Range-Catalogue-2022-2023.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center border-[2px] border-gray-200 bg-white hover:border-gray-300 transition-colors duration-300 w-full sm:max-w-[280px] md:max-w-[300px]"
                    >
                        <div className="w-full p-1 bg-white flex justify-center">
                            <img
                                src="https://autoono-demo.btire.com/media/wysiwyg/tbr-catalogue.png"
                                alt={t("catalogue.tbrCatalog")}
                                className="w-full h-auto object-contain"
                            />
                        </div>
                        <div className="w-full border-t-[2px] border-gray-200 py-3 flex justify-center bg-white group-hover:bg-gray-50 transition-colors">
                            <span className="text-black font-bold text-body-lg">
                                {t("catalogue.tbrCatalog")}
                            </span>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
