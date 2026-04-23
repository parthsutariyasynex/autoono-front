"use client";
import { useTranslation } from "@/hooks/useTranslation";
import { Download, ExternalLink } from "lucide-react";
import React from "react";

export default function CataloguePage() {
    const { t, isRtl } = useTranslation();
    return (
        <div className="min-h-screen bg-white">

            {/* Banner Section */}
            <div className="w-full h-[300px] md:h-[400px] lg:h-[420px] relative overflow-hidden">
                <img
                    src="/images/about-tyresonline-uae.jpg"
                    alt={t("catalogue.title")}
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20" />
            </div>

            {/* Content Section */}
            <div className="max-w-[1200px] mx-auto px-6 mt-12 md:mt-20 pb-20 flex flex-col items-center" dir={isRtl ? "rtl" : "ltr"}>
                <div className="relative mb-16">
                    <h1 className="text-h2 md:text-[42px] font-black text-center tracking-tight text-black uppercase">
                        {t("catalogue.title")}
                    </h1>
                    <div className="w-24 h-2 bg-primary mx-auto mt-4 rounded-full" />
                </div>

                {/* Single Catalogue Container */}
                <div className="w-full max-w-[380px] mx-auto group">

                    {/* Maxxis Brochure Card */}
                    <a
                        href="https://autoono-demo.btire.com/media/wysiwyg/2020_Maxxis_OffRoad_Brochure_71420.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex flex-col bg-white rounded-2xl border-2 border-gray-100 hover:border-primary transition-all duration-500 shadow-xl hover:shadow-2xl overflow-hidden hover:-translate-y-2"
                    >
                        <div className="aspect-[3/4] overflow-hidden bg-gray-50 flex items-center justify-center p-2 relative">
                            <img
                                src="https://autoono-demo.btire.com/media/wysiwyg/imdad-pdf-image.png"
                                alt={t("catalogue.maxxisCatalog")}
                                className="w-full h-full object-contain filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-700 ease-out"
                            />
                            <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition-transform duration-500">
                                    <ExternalLink className="text-black w-7 h-7" />
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white border-t border-gray-100 flex items-center justify-center group-hover:bg-gray-50 transition-colors">
                            <span className="font-black text-black text-body-lg md:text-xl uppercase tracking-tighter text-center">
                                {t("catalogue.maxxisCatalog")}
                            </span>
                        </div>
                    </a>

                </div>
            </div>
        </div>
    );
}
