"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { createPortal } from "react-dom";

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
    isOpen: boolean;
    isActive: boolean;
    items: SubMenuItemType[];
    isMobile?: boolean;
    /** Optional notification badge count */
    badge?: number;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
};

const ExpandableMenuItem = ({ href, icon: Icon, title, isOpen, isActive, items, isMobile = false, badge, onMouseEnter, onMouseLeave }: ExpandableMenuItemProps) => {
    const pathname = usePathname();
    const router = useRouter();

    const [showFlyout, setShowFlyout] = useState(false);
    const [flyoutPos, setFlyoutPos] = useState({ top: 0, left: 0 });
    const containerRef = useRef<HTMLDivElement>(null);
    const flyoutRef = useRef<HTMLDivElement>(null);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Position the flyout using fixed positioning (avoids overflow clipping)
    const updatePosition = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        // Find the sidebar's right edge by walking up the DOM
        const sidebar = containerRef.current.closest('[data-sidebar]');
        const sidebarRight = sidebar ? sidebar.getBoundingClientRect().right : rect.right;
        setFlyoutPos({
            left: sidebarRight + 8,
            top: Math.min(rect.top, window.innerHeight - 300),
        });
    }, []);

    const handleMouseEnter = useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
        updatePosition();
        setShowFlyout(true);
        onMouseEnter?.();
    }, [updatePosition, onMouseEnter]);

    const handleMouseLeave = useCallback(() => {
        hideTimer.current = setTimeout(() => setShowFlyout(false), 120);
        onMouseLeave?.();
    }, [onMouseLeave]);

    const handleFlyoutEnter = useCallback(() => {
        if (hideTimer.current) clearTimeout(hideTimer.current);
    }, []);

    const handleFlyoutLeave = useCallback(() => {
        setShowFlyout(false);
    }, []);

    // Close on route change
    useEffect(() => {
        setShowFlyout(false);
    }, [pathname]);

    // Cleanup timer
    useEffect(() => {
        return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
    }, []);

    if (isMobile) {
        return (
            <Link href={href} className="flex-shrink-0">
                <div className={cn("relative flex items-center justify-center p-5 rounded-xl transition-all duration-200", isActive ? "bg-primary/20 text-primary" : "text-muted-foreground")}>
                    <Icon className={cn("w-7 h-7", isActive && "text-primary")} />
                </div>
            </Link>
        );
    }

    // ─── Desktop ───
    return (
        <div
            className="w-full relative"
            ref={containerRef}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Main Item */}
            <div
                onClick={() => router.push(href)}
                className="cursor-pointer"
            >
                <div className={cn(
                    "relative w-full flex items-center rounded-xl transition-all duration-200 text-sm font-medium",
                    isOpen ? "py-1.5 px-2" : "flex-col py-2 px-1 justify-center gap-0.5",
                    isActive
                        ? "text-primary"
                        : cn("text-muted-foreground", isOpen && "hover:text-foreground hover:bg-white/5")
                )}>
                    {/* Active indicator */}
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

                    {/* Title & Chevron — no overlap with badges */}
                    <motion.div
                        initial={false}
                        animate={{
                            opacity: isOpen ? 1 : 0,
                            width: isOpen ? "auto" : 0,
                            display: isOpen ? "flex" : "none",
                        }}
                        className="ml-2.5 flex-1 items-center justify-between overflow-hidden whitespace-nowrap z-10"
                    >
                        <span className="truncate">{title}</span>
                        <div className="flex items-center gap-2 ml-auto shrink-0">
                            {!!badge && badge > 0 && (
                                <span className="inline-flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold leading-none">
                                    {badge > 99 ? "99+" : badge}
                                </span>
                            )}
                            <ChevronRight className={cn(
                                "w-3 h-3 transition-transform duration-200 text-muted-foreground",
                                showFlyout ? "rotate-90 text-primary" : ""
                            )} />
                        </div>
                    </motion.div>

                    {/* Micro-Label for Collapsed State */}
                    {!isOpen && (
                        <span className={cn(
                            "text-[9px] uppercase tracking-wider mt-0.5 truncate max-w-[60px] text-center",
                            isActive ? "text-primary font-semibold" : "text-muted-foreground"
                        )}>
                            {title.split(' ')[0]}
                        </span>
                    )}
                </div>
            </div>

            {
                showFlyout && typeof document !== 'undefined' && createPortal(
                    <div
                        ref={flyoutRef}
                        onMouseEnter={handleFlyoutEnter}
                        onMouseLeave={handleFlyoutLeave}
                        style={{ position: 'fixed', top: flyoutPos.top, left: flyoutPos.left, zIndex: 9999 }}
                    >
                        <motion.div
                            initial={{ opacity: 0, x: -8, scale: 0.96 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: -8, scale: 0.96 }}
                            transition={{ duration: 0.12, ease: "easeOut" }}
                            className="min-w-[200px] max-h-[70vh] overflow-y-auto p-1 rounded-xl border border-white/10 shadow-2xl backdrop-blur-xl bg-[#0a0a0a]/95 custom-scrollbar"
                        >
                            {/* Header */}
                            <div className="px-3 py-1.5 border-b border-white/5 mb-1 shrink-0">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-primary/80">{title}</span>
                            </div>

                            {/* Sub-items */}
                            <div className="flex flex-col gap-0.5">
                                {items.map((subItem) => {
                                    // loose match for active state so sub-routes stay highlighted
                                    const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href);
                                    return (
                                        <Link
                                            key={subItem.href}
                                            href={subItem.href}
                                            onClick={(e) => e.stopPropagation()}
                                            className={cn(
                                                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all duration-200",
                                                isSubActive
                                                    ? "bg-primary/20 text-primary font-medium"
                                                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            {subItem.icon && <subItem.icon className="w-3.5 h-3.5 shrink-0" />}
                                            <span className="truncate">{subItem.label}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};

export default ExpandableMenuItem;
