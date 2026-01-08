"use client";

import { cn } from "@/lib/utils";

interface ThemedLogoProps {
    variant?: "wide" | "compact";
    className?: string;
    alt?: string;
}

/**
 * Logo component that inherits color from the active theme.
 * Uses CSS filters to shift the cyan base logo to match theme primary colors.
 */
export function ThemedLogo({
    variant = "wide",
    className,
    alt = "BasaltCRM logo"
}: ThemedLogoProps) {
    const src = variant === "wide" ? "/BasaltCRMWide.png" : "/BasaltCRM.png";

    return (
        <img
            src={src}
            alt={alt}
            className={cn("themed-logo", className)}
        />
    );
}
