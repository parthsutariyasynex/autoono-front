"use client";
import { useTranslation } from "@/hooks/useTranslation";
import React from "react";
import ContactForm from "./components/ContactForm";
import MapSection from "./components/MapSection";

export default function BranchLocationsPage() {
    const { t, isRtl } = useTranslation();

    return (
        <div className="min-h-screen bg-white font-sans text-black overflow-x-hidden selection:bg-primary/30">

            {/* Full Width Map Section */}
            <div className="w-full">
                <MapSection />
            </div>

            {/* Main Content Area */}
            <main className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-12 md:py-20 lg:py-24" dir={isRtl ? "rtl" : "ltr"}>

                {/* Title */}
                <h1 className="text-h3 md:text-h1 font-black text-center mb-16 tracking-tight text-black uppercase">
                    {t("locations.title")}
                </h1>

                <div className="max-w-[850px] mx-auto">
                    {/* Address Card */}
                    <div className="w-full max-w-[400px] border border-gray-100 mb-12 shadow-sm">
                        <div className="p-6">
                            <h2 className="text-body font-black mb-4 text-black uppercase">{t("locations.westRegion")}</h2>
                            <p className="text-body-lg leading-[1.6] text-black/80 whitespace-pre-line font-normal mb-0">
                                {t("locations.westAddress")}
                            </p>
                        </div>
                        {/* Map Link Row */}
                        <a
                            href="https://maps.google.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-gray-50 flex items-center gap-3 px-6 py-3 border-t border-gray-100 hover:bg-gray-100 transition-colors group"
                        >
                            <svg className="w-4 h-4 text-black" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                                <circle cx="12" cy="10" r="3" />
                            </svg>
                            <span className="text-body-lg font-medium text-black group-hover:text-primary transition-colors">{t("locations.googleMap")}</span>
                        </a>
                    </div>

                    {/* Contact Form Section */}
                    <ContactForm />
                </div>
            </main>
        </div>
    );
}
