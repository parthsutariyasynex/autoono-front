"use client";

import React from "react";
import Navbar from "@/app/components/Navbar";

export default function CataloguePage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Banner Section */}
            <div className="w-full h-[300px] md:h-[400px] lg:h-[500px]">
                <img
                    src="/images/about-tyresonline-uae.jpg"
                    alt="Al-Talayi Warehouse"
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Content Section */}
            <div className="max-w-[1200px] mx-auto px-6 mt-16 md:mt-20 pb-20 flex flex-col items-center">
                <h1 className="text-[28px] md:text-[32px] font-black text-center mb-16 tracking-wide text-black uppercase">
                    Product Catalogue
                </h1>

                {/* Catalogue Cover Document */}
                <div className="w-full flex justify-center mt-4">
                    <a
                        href="https://altalayi-demo.btire.com/media/wysiwyg/TBR-Range-Catalogue-2022-2023.pdf"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col items-center border-[2px] border-gray-200 bg-white hover:border-gray-300 transition-colors duration-300 w-full max-w-[300px]"
                    >
                        {/* Image Container */}
                        <div className="w-full p-1 bg-white flex justify-center">
                            <img
                                src="https://altalayi-demo.btire.com/media/wysiwyg/tbr-catalogue.png"
                                alt="TBR Range Catalog"
                                className="w-full h-auto object-contain"
                            />
                        </div>

                        {/* Text Below Image */}
                        <div className="w-full border-t-[2px] border-gray-200 py-3 flex justify-center bg-white group-hover:bg-gray-50 transition-colors">
                            <span className="text-black font-bold text-[14px]">
                                TBR Range Catalog
                            </span>
                        </div>
                    </a>
                </div>
            </div>
        </div>
    );
}
