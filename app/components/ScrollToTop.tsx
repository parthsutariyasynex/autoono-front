"use client";

import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
    const [isVisible, setIsVisible] = useState(false);

    const toggleVisibility = () => {
        if (window.scrollY > 300) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    };

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    useEffect(() => {
        window.addEventListener("scroll", toggleVisibility);
        return () => window.removeEventListener("scroll", toggleVisibility);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-10 right-10 z-[100] animate-fade-in group pointer-events-none">
            <button
                onClick={scrollToTop}
                className="bg-[#f5a623] hover:bg-black text-black hover:text-white p-3 md:p-4 rounded-full shadow-2xl transition-all duration-500 transform group-hover:scale-110 active:scale-95 border-2 border-white/40 pointer-events-auto"
                aria-label="Scroll to top"
            >
                <ArrowUp className="w-5 h-5 md:w-6 md:h-6 stroke-[3px]" />
            </button>
        </div>
    );
}
