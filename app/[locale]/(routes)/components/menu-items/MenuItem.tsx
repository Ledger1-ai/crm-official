"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

type MenuItemProps = {
    href: string;
    icon: LucideIcon | React.ElementType;
    title: string;
    isOpen: boolean;
    isActive: boolean;
    onClick?: () => void;
    isMobile?: boolean;
    badge?: number;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
};

const MenuItem = ({ href, icon: Icon, title, isOpen, isActive, onClick, isMobile = false, badge, onMouseEnter, onMouseLeave }: MenuItemProps) => {
    // Determine label for collapsed/mobile view
    // Specific override: Dashboard -> Home
    const rawLabel = title;
    const isDashboard = rawLabel === "Dashboard";
    const microLabel = isDashboard ? "Home" : rawLabel.split(' ')[0];

    // ─── Mobile ───
    if (isMobile) {
        return (
            <Link href={href} onClick={onClick} className="flex-shrink-0">
                <div
                    className={cn(
                        "relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200 gap-0.5",
                        isActive
                            ? "bg-primary/20 text-primary"
                            : "text-muted-foreground"
                    )}
                >
                    <Icon className={cn("w-6 h-6", isActive && "text-primary")} />
                    <span className={cn(
                        "text-[9px] uppercase tracking-wider font-semibold truncate max-w-[64px]",
                        isActive ? "text-primary" : "text-muted-foreground"
                    )}>
                        {microLabel}
                    </span>
                </div>
            </Link>
        );
    }

    // ─── Desktop ───
    return (
        <div className="w-full" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
            <Link href={href} onClick={onClick}>
                <div
                    className={cn(
                        "relative w-full flex items-center rounded-xl transition-all duration-200 group text-sm font-medium",
                        isOpen ? "py-1.5 px-2" : "flex-col py-2 px-1 justify-center gap-0.5",
                        isActive
                            ? "text-primary"
                            : cn("text-muted-foreground", isOpen && "hover:text-foreground hover:bg-white/5")
                    )}
                >
                    {/* Active glow */}
                    {isActive && (
                        <div className="absolute inset-0 rounded-xl bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.15)] content-['']" />
                    )}

                    {/* Icon */}
                    <div className={cn(
                        "relative z-10 flex items-center justify-center min-w-[24px]",
                        !isOpen && "w-8 h-8 rounded-md transition-all duration-200 hover:bg-white/10 hover:ring-1 hover:ring-white/70 group/icon"
                    )}>
                        <Icon
                            className={cn(
                                "w-[18px] h-[18px] transition-colors duration-200",
                                isActive
                                    ? "text-primary"
                                    : (isOpen ? "group-hover:text-primary" : "group-hover/icon:text-primary text-muted-foreground")
                            )}
                        />
                    </div>

                    {/* Title */}
                    <motion.span
                        initial={false}
                        animate={{
                            opacity: isOpen ? 1 : 0,
                            width: isOpen ? "auto" : 0,
                            display: isOpen ? "block" : "none",
                        }}
                        transition={{ duration: 0.2 }}
                        className="ml-2.5 truncate whitespace-nowrap overflow-hidden z-10"
                    >
                        {title}
                    </motion.span>

                    {/* Micro-Label for Collapsed State */}
                    {!isOpen && (
                        <span className={cn(
                            "text-[9px] uppercase tracking-wider mt-0.5 truncate max-w-[60px] text-center",
                            isActive ? "text-primary font-semibold" : "text-muted-foreground"
                        )}>
                            {microLabel}
                        </span>
                    )}

                    {/* Badge — positioned to never overlap chevrons */}
                    {badge && badge > 0 && isOpen && (
                        <span className="ml-auto z-10 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary/20 text-primary text-[10px] font-bold leading-none shrink-0">
                            {badge > 99 ? "99+" : badge}
                        </span>
                    )}
                </div>
            </Link>
        </div>
    );
};

export default MenuItem;
