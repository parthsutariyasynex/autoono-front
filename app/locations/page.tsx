"use client";
import { useTranslation } from "@/hooks/useTranslation";

import React from "react";
import MapSection from "./components/MapSection";
import RegionGrid from "./components/RegionGrid";
import ContactForm from "./components/ContactForm";
import styles from "./locations.module.css";

export default function BranchLocationsPage() {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-white font-sans text-black overflow-x-hidden">


            {/* Google Map Section */}
            <MapSection />

            {/* Main Content Area */}
            <main className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-20 lg:py-24">

                {/* Contact Heading Section */}
                <div className={`text-center mb-16 md:mb-24 ${styles.fadeIn}`}>
                    <h2 className="text-[22px] sm:text-[26px] md:text-[32px] lg:text-[38px] font-black text-black uppercase tracking-tighter leading-none mb-6">
                        {t("locations.title")}
                    </h2>
                    <div className="h-1.5 w-20 sm:w-24 md:w-28 bg-[#f5a623] mx-auto rounded-full"></div>
                </div>

                {/* Region Selection Grid */}
                <RegionGrid />

                {/* Contact Form Section */}
                <div className="mt-12 md:mt-20">
                    <ContactForm />
                </div>
            </main>
        </div>
    );
}
