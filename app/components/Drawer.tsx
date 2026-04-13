"use client";

import React from "react";
import { X } from "lucide-react";
import Popup from "./Popup";

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    scrollable?: boolean;
}

/**
 * Reusable Side Drawer component that slides in from the right.
 * Now powered by Framer Motion for premium smooth animations.
 */
export default function Drawer({ isOpen, onClose, children, title, scrollable = false }: DrawerProps) {
    return (
        <Popup
            isOpen={isOpen}
            onClose={onClose}
            animation="slide-right"
            className="flex flex-col"
            scrollable={scrollable}
        >
            {/* Close Button Overlay */}
            <button
                onClick={onClose}
                className="absolute right-4 top-4 z-[110] p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-gray-100 transition-colors text-gray-500 hover:text-black"
                aria-label="Close drawer"
            >
                <X size={22} strokeWidth={2.5} />
            </button>

            {/* Header if title exists */}
            {title && (
                <div className="px-6 py-5 border-b border-gray-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                </div>
            )}

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {children}
            </div>
        </Popup>
    );
}
