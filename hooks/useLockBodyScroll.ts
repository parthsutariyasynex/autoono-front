"use client";

import { useLayoutEffect } from "react";

/**
 * Reusable hook to lock body scroll when a component (like a modal) is mounted.
 * Prevents layout shift on pages that currently have a scrollbar by adding
 * compensating padding-right equal to scrollbar width. Short pages with no
 * scrollbar compute scrollbarWidth=0 and get no padding (so no visual change).
 *
 * @param lock - boolean to determine if scroll should be locked
 */
export function useLockBodyScroll(lock: boolean = true) {
    useLayoutEffect(() => {
        if (!lock) return;

        const originalStyle = window.getComputedStyle(document.body).overflow;
        const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

        document.body.style.overflow = "hidden";
        if (scrollbarWidth > 0) {
            document.body.style.paddingRight = `${scrollbarWidth}px`;
        }

        // Expose to fixed-position elements (Navbar reads this when sticky).
        document.documentElement.style.setProperty("--scrollbar-width", `${scrollbarWidth}px`);

        return () => {
            document.body.style.overflow = originalStyle;
            document.body.style.paddingRight = originalPaddingRight;
            document.documentElement.style.setProperty("--scrollbar-width", "0px");
        };
    }, [lock]);
}
