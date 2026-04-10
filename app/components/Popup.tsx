"use client";

import React, { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Highly reusable Popup component using Framer Motion for smooth transitions.
 * Supports center modals (fade + scale) and sliding panels (side drawers / bottom sheets).
 */

type AnimationType = "fade-scale" | "slide-right" | "slide-left" | "slide-bottom";

interface PopupProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
    animation?: AnimationType;
    maxWidth?: string;
    size?: "sm" | "md" | "lg" | "xl" | "full";
    showOverlay?: boolean;
    closeOnOverlayClick?: boolean;
    className?: string;
}

const Popup: React.FC<PopupProps> = ({
    isOpen,
    onClose,
    children,
    title,
    animation = "fade-scale",
    maxWidth = "max-w-md",
    size = "md",
    showOverlay = true,
    closeOnOverlayClick = true,
    className = "",
}) => {
    // Handle ESC key
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape" && isOpen) {
                onClose();
            }
        },
        [isOpen, onClose]
    );

    useEffect(() => {
        if (isOpen) {
            // Prevent Layout Shift
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.overflow = "hidden";
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            document.documentElement.style.setProperty("--scrollbar-width", `${scrollbarWidth}px`);

            window.addEventListener("keydown", handleKeyDown);
        } else {
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
            document.documentElement.style.setProperty("--scrollbar-width", "0px");
        }
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
            document.body.style.paddingRight = "";
            document.documentElement.style.setProperty("--scrollbar-width", "0px");
        };
    }, [isOpen, handleKeyDown]);

    // Animation variants
    const backdropVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1 },
    };

    const getVariants = () => {
        switch (animation) {
            case "fade-scale":
                return {
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { opacity: 1, scale: 1 },
                    exit: { opacity: 0, scale: 0.9 },
                };
            case "slide-right":
                return {
                    hidden: { x: "100%" },
                    visible: { x: 0 },
                    exit: { x: "100%" },
                };
            case "slide-left":
                return {
                    hidden: { x: "-100%" },
                    visible: { x: 0 },
                    exit: { x: "-100%" },
                };
            case "slide-bottom":
                return {
                    hidden: { y: "100%" },
                    visible: { y: 0 },
                    exit: { y: "100%" },
                };
            default:
                return {
                    hidden: { opacity: 0 },
                    visible: { opacity: 1 },
                    exit: { opacity: 0 },
                };
        }
    };

    const contentVariants = getVariants();

    // Layout classes based on animation type
    const getLayoutClasses = () => {
        switch (animation) {
            case "slide-right":
                return "justify-end items-stretch";
            case "slide-left":
                return "justify-start items-stretch";
            case "slide-bottom":
                return "justify-center items-end";
            default: // fade-scale (centered)
                return "justify-center items-center p-4";
        }
    };

    const getContentClasses = () => {
        switch (animation) {
            case "slide-right":
            case "slide-left":
                return "h-full w-full sm:w-[480px]";
            case "slide-bottom":
                return "w-full sm:max-w-2xl rounded-t-2xl";
            default: // centered modal
                return `w-full ${maxWidth} rounded-2xl`;
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className={`fixed inset-0 z-[1000] flex ${getLayoutClasses()}`}>
                    {/* Overlay */}
                    {showOverlay && (
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="hidden"
                            variants={backdropVariants}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
                            onClick={closeOnOverlayClick ? onClose : undefined}
                        />
                    )}

                    {/* Popup Content */}
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        variants={contentVariants}
                        transition={{
                            duration: 0.6,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className={`relative bg-white shadow-2xl overflow-hidden pointer-events-auto flex flex-col ${getContentClasses()} ${className}`}
                    >
                        {title && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                            </div>
                        )}
                        <div className="flex-1 overflow-y-auto">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Popup;
