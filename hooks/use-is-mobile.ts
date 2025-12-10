"use client";

import { useState, useEffect } from "react";

/**
 * Hook to detect mobile screen size.
 * Uses CSS-based initial detection to avoid hydration mismatch.
 */
export function useIsMobile(breakpoint: number = 768): boolean {
    // Initialize with a check that works on client during first render
    const [isMobile, setIsMobile] = useState(() => {
        if (typeof window !== "undefined") {
            return window.innerWidth < breakpoint;
        }
        return false; // SSR fallback
    });

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < breakpoint);
        checkMobile(); // Check on mount in case SSR guess was wrong
        window.addEventListener("resize", checkMobile);
        return () => window.removeEventListener("resize", checkMobile);
    }, [breakpoint]);

    return isMobile;
}
