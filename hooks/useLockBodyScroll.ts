"use client";

import { useEffect, useLayoutEffect } from "react";

/**
 * Reusable hook to lock body scroll when a component (like a modal) is mounted.
 * Prevents background scrolling and layout shifts.
 * 
 * @param lock - boolean to determine if scroll should be locked
 */
export function useLockBodyScroll(lock: boolean = true) {
    useLayoutEffect(() => {
        if (!lock) return;

        // Save original styles
        const originalStyle = window.getComputedStyle(document.body).overflow;
        const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

        // Prevent layout shift by adding padding equal to scrollbar width
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = "hidden";
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        // Set global CSS variable for other components (like fixed headers)
        document.documentElement.style.setProperty("--scrollbar-width", `${scrollbarWidth}px`);

        return () => {
            document.body.style.overflow = originalStyle;
            document.body.style.paddingRight = originalPaddingRight;
            document.documentElement.style.setProperty("--scrollbar-width", "0px");
        };
    }, [lock]);
}
