"use client";

import React from "react";

export default function AboutPage() {
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
            <div className="max-w-[1200px] mx-auto px-6 mt-16 md:mt-20 pb-20">
                <h1 className="text-[28px] md:text-[32px] font-black text-center mb-16 tracking-wide text-black uppercase">
                    About Al-Talayi
                </h1>

                <div className="flex flex-col gap-10 text-black font-semibold text-[15px] md:text-[16px] leading-[1.8] max-w-[1000px] mx-auto text-center md:text-left">
                    <p>
                        Al-Talayi Company is the largest distribution network of Bridgestone tires in Saudi Arabia and the largest distributor of Bridgestone in the Middle East and North Africa.
                    </p>

                    <p>
                        Allalayi company limitied works as the exclusive Bridgestone&apos;s Tires the company&apos;s headquarters in Jeddah, where it has 11 Tire Service center.
                    </p>

                    <p>
                        The Company managed by a group of managers and skilled technicians and vendors, which enabled the company to achieve great successes and continue through the achievement of the highest performance and building is located on the scope of the Saudi market.
                    </p>
                </div>
            </div>
        </div>
    );
}
