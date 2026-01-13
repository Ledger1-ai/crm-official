"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

// SubItem Type
export type SubMenuItemType = {
    label: string;
    href: string;
    icon?: LucideIcon;
};

type ExpandableMenuItemProps = {
    href: string;
    icon: LucideIcon;
    title: string;
    isOpen: boolean; // Sidebar open state
    isActive: boolean; // Parent active state
    items: SubMenuItemType[]; // Sub menu items
    isMobile?: boolean;
};

const ExpandableMenuItem = ({ href, icon: Icon, title, isOpen, isActive, items, isMobile = false }: ExpandableMenuItemProps) => {
    const pathname = usePathname();
    const router = useRouter();

    // State for Flyout Visibility
    const [showFlyout, setShowFlyout] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close flyout when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowFlyout(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Update showing state on route change
    useEffect(() => {
        setShowFlyout(false);
    }, [pathname]);


    if (isMobile) {
        // Mobile Layout - Keep simple list or link for now
        return (
            <div className="flex flex-col gap-2">
                <Link href={href} className="flex-shrink-0">
                    <div className={cn("relative flex items-center justify-center p-5 rounded-xl transition-all duration-200", isActive ? "bg-primary/20 text-primary" : "text-muted-foreground")}>
                        <Icon className={cn("w-7 h-7", isActive && "text-primary")} />
                    </div>
                </Link>
            </div>
        );
    }

    // Desktop Layout
    return (
        <div className="w-full relative" ref={containerRef}>
            <div
                className={cn(
                    "relative w-full flex flex-col rounded-xl transition-all duration-200 group",
                )}
                onMouseEnter={() => setShowFlyout(true)} // Always trigger on hover (expanded or collapsed)
                onMouseLeave={() => setShowFlyout(false)}
            >
                {/* Main Parent Item */}
                <div
                    onClick={(e) => {
                        // Navigate to Main Page on Click
                        router.push(href);
                    }}
                    className="cursor-pointer"
                >
                    <div className={cn(
                        "relative w-full flex items-center rounded-xl transition-all duration-200 text-sm font-medium z-20",
                        isOpen ? "py-2 px-3" : "py-1 px-2 justify-center",
                        isActive
                            ? "text-primary"
                            : cn("text-muted-foreground", isOpen && "hover:text-foreground hover:bg-white/5")
                    )}>
                        {/* Active Indicator */}
                        {isActive && (
                            <div className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] pointer-events-none" />
                        )}

                        {/* Icon */}
                        <div className={cn(
                            "relative z-10 flex items-center justify-center min-w-[24px]",
                            !isOpen && "w-8 h-8 rounded-md transition-all duration-200 hover:bg-white/10 hover:ring-1 hover:ring-white/70 group/icon"
                        )}>
                            <Icon className={cn("w-5 h-5 transition-colors duration-200", isActive ? "text-primary" : "group-hover:text-primary")} />
                        </div>

                        {/* Title & Chevron */}
                        <motion.div
                            initial={false}
                            animate={{
                                opacity: isOpen ? 1 : 0,
                                width: isOpen ? "auto" : 0,
                                display: isOpen ? "flex" : "none",
                            }}
                            className="ml-3 flex-1 items-center justify-between overflow-hidden whitespace-nowrap z-10"
                        >
                            <span>{title}</span>
                            <ChevronRight className={cn("w-3 h-3 transition-transform duration-200", showFlyout ? "rotate-90" : "")} />
                        </motion.div>
                    </div>
                </div>

                {/* Flyout Menu (Right Side) */}
                <AnimatePresence>
                    {showFlyout && (
                        <motion.div
                            initial={{ opacity: 0, x: -10, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -10, scale: 0.95 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                            className={cn(
                                "absolute top-0 z-[100] min-w-[220px] p-2 rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl bg-[#0a0a0a]/95",
                                // Positioning: 
                                // If Expanded: Left = 100% + gap
                                // If Collapsed: Left = 100% + gap (Icon width + gap)
                                "left-[calc(100%+0.5rem)]"
                            )}
                        >
                            {/* Header in Flyout (Match parent title) */}
                            <div className="px-3 py-2 border-b border-white/5 mb-1 cursor-default">
                                <span className="text-sm font-semibold text-white/90">{title}</span>
                            </div>

                            <div className="flex flex-col gap-0.5">
                                {items.map((subItem) => {
                                    const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href);
                                    return (
                                        <Link
                                            key={subItem.href}
                                            href={subItem.href}
                                            className={cn(
                                                "flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-200",
                                                isSubActive
                                                    ? "bg-primary/20 text-primary font-medium"
                                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {subItem.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ExpandableMenuItem;
