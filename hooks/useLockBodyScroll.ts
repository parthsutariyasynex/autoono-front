"use client";

import { useLayoutEffect } from "react";

/**
 * Reusable hook to lock body scroll when a component (like a modal) is mounted.
 *
 * Layout shift prevention is handled by `scrollbar-gutter: stable` on <html>
 * (see app/globals.css). That reserves scrollbar space permanently, so when
 * `overflow: hidden` is applied here the page width does not change and no
 * padding-right compensation is needed. For browsers that lack
 * `scrollbar-gutter` support we fall back to the classic padding-right trick.
 *
 * @param lock - boolean to determine if scroll should be locked
 */
export function useLockBodyScroll(lock: boolean = true) {
    useLayoutEffect(() => {
        if (!lock) return;

        const originalStyle = window.getComputedStyle(document.body).overflow;
        const originalPaddingRight = window.getComputedStyle(document.body).paddingRight;

        const supportsScrollbarGutter =
            typeof CSS !== "undefined" && CSS.supports("scrollbar-gutter", "stable");

        // Only compute + apply padding compensation when scrollbar-gutter isn't
        // available (older browsers). With scrollbar-gutter: stable, the space
        // stays reserved and adding padding would double-pad and shift content.
        const scrollbarWidth = supportsScrollbarGutter
            ? 0
            : window.innerWidth - document.documentElement.clientWidth;

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
