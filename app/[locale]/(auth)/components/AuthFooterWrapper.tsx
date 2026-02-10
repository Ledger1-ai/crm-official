"use client";

import { usePathname } from "next/navigation";
import Footer from "@/app/[locale]/(routes)/components/Footer";

export const AuthFooterWrapper = () => {
    const pathname = usePathname();

    // Default to full width for unknown pages, or match register/login specifically
    let widthClass = "w-full";

    if (pathname.includes("/sign-in")) {
        // Match the base width of the login card, avoiding expansion on larger screens to ensure it doesn't look "too wide"
        widthClass = "w-full max-w-sm";
    } else if (pathname.includes("/register")) {
        // Register page has p-10 (5rem) padding, so we must subtract that to match the card width exactly
        // widthClass = "w-[calc(100%-5rem)] max-w-lg sm:max-w-xl mx-auto";
        return null;
    }
    return (
        <div className={widthClass}>
            <Footer />
        </div>
    );
};
