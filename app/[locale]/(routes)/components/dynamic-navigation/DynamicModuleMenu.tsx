
"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
    ChevronLeft,
    ChevronRight,
    Home,
    Users,
    Headset,
    Building2,
    Mail,
    Wrench,
    Globe,
    Calendar
} from "lucide-react";

import { cn } from "@/lib/utils";
import { ThemedLogo } from "@/components/ThemedLogo";

import MenuItem from "../menu-items/MenuItem";
import ExpandableMenuItem, { SubMenuItemType } from "../menu-items/ExpandableMenuItem";
import HubLabel from "../menu-items/HubLabel";
import { NavItem, NavItemType } from "@/lib/navigation-defaults";
import { getIcon } from "./icon-map";

// ─── Types ───────────────────────────────────────────────
type Props = {
    navStructure: NavItem[];
    modules: any; // Used for permission checks
    dict: any;    // Translations
    features: string[]; // Enabled features
    isPartnerAdmin: boolean;
    teamRole?: string;
    serviceBadge?: number; // Count for service cases
};

const sidebarVariants = {
    expanded: {
        width: "12.5rem",
        transition: { type: "spring", stiffness: 200, damping: 25 } as const,
    },
    collapsed: {
        width: "4.5rem",
        transition: { type: "spring", stiffness: 200, damping: 25 } as const,
    },
};

const logoVariants = {
    expanded: { opacity: 1, x: 0, display: "block" as const },
    collapsed: { opacity: 0, x: -10, transitionEnd: { display: "none" as const } },
};

const compactLogoVariants = {
    expanded: { opacity: 0, x: -10, display: "none" as const },
    collapsed: { opacity: 1, x: 0, display: "block" as const },
};

// ─── Component ───────────────────────────────────────────
const DynamicModuleMenu = ({
    navStructure,
    modules,
    dict,
    features,
    isPartnerAdmin,
    teamRole = "MEMBER",
    serviceBadge = 0
}: Props) => {
    const [open, setOpen] = useState(true);
    const [isMounted, setIsMounted] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        setIsMounted(true);
        try {
            const persisted = localStorage.getItem("sidebar-open");
            if (persisted !== null) setOpen(persisted === "true");
        } catch (_) { }
    }, []);

    const toggleSidebar = () => {
        const next = !open;
        setOpen(next);
        try { localStorage.setItem("sidebar-open", String(next)); } catch (_) { }
    };

    // ─── Permission Logic ───
    const hasFeature = (f?: string) => !f || features.includes("all") || features.includes(f);
    const hasModule = (n?: string) => !n || modules.find((m: any) => m.name === n && m.enabled);
    const checkRole = (minRole?: string) => {
        if (!minRole) return true;
        if (minRole === "MEMBER") return true;
        if (minRole === "ADMIN") return teamRole !== "MEMBER"; // Simplified typical check
        if (minRole === "PARTNER_ADMIN") return isPartnerAdmin;
        return false;
    };

    const isVisible = (item: NavItem) => {
        if (item.hidden) return false;
        if (item.permissions) {
            if (item.permissions.module && !hasModule(item.permissions.module)) return false;
            if (item.permissions.feature && !hasFeature(item.permissions.feature)) return false;
            if (item.permissions.minRole && !checkRole(item.permissions.minRole)) return false;
        }
        return true;
    };

    // ─── Active Logic ───
    const isPath = (pattern: RegExp) => pattern.test(pathname);
    const checkActive = (item: NavItem): boolean => {
        if (!item.href) return false;
        // Specialized logic for "Messages" vs "Forms"
        if (item.href === "/messages") return isPath(/^\/([a-z]{2}\/)?messages\/?$/);

        // Generic logic
        // If exact match (dashboard)
        if (item.href === "/dashboard") return pathname === "/dashboard" || pathname.endsWith("/dashboard");

        // If prefix match
        return pathname.startsWith(item.href);
    };

    // ─── Renderer ───
    const renderItem = (item: NavItem) => {
        if (!isVisible(item)) return null;

        if (item.type === "group") {
            // Group header + Children
            const visibleChildren = item.children?.filter(isVisible);
            if (!visibleChildren || visibleChildren.length === 0) return null;

            return (
                <React.Fragment key={item.id}>
                    <HubLabel label={item.label} isOpen={open} />
                    {item.children?.map(renderItem)}
                </React.Fragment>
            );
        }

        if (item.children && item.children.length > 0) {
            // Expandable Item
            // Map children to SubMenuItemType
            const subItems: SubMenuItemType[] = item.children.map(child => ({
                label: child.label,
                href: child.href || "#",
                icon: child.iconName ? getIcon(child.iconName) : undefined
            }));

            // Check if any child is active to activate parent (or parent itself)
            const isActive = checkActive(item) || item.children.some(child => child.href && pathname.startsWith(child.href));

            return (
                <ExpandableMenuItem
                    key={item.id}
                    href={item.href || "#"}
                    icon={getIcon(item.iconName)}
                    title={item.label}
                    isOpen={open}
                    isActive={isActive}
                    items={subItems}
                    badge={item.badge === "serviceBadge" ? serviceBadge : undefined}
                />
            );
        }

        // Standard Item
        return (
            <MenuItem
                key={item.id}
                href={item.href || "#"}
                icon={getIcon(item.iconName)}
                title={item.label}
                isOpen={open}
                isActive={checkActive(item)}
            />
        );
    };

    if (!isMounted) return null;

    return (
        <>
            <div className="hidden md:block h-screen sticky top-0 z-[100]">
                <motion.div
                    data-sidebar
                    initial={open ? "expanded" : "collapsed"}
                    animate={open ? "expanded" : "collapsed"}
                    variants={sidebarVariants}
                    className={cn(
                        "relative h-full flex flex-col border-r border-primary/20 shadow-xl group",
                        "bg-gradient-to-b from-background/95 via-background/90 to-background/95",
                        "backdrop-blur-xl"
                    )}
                >
                    {/* Ambient Glow */}
                    <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none">
                        <div className="absolute top-[-10%] left-[-10%] w-40 h-40 bg-primary/10 rounded-full blur-3xl opacity-50" />
                        <div className="absolute bottom-[-10%] right-[-10%] w-40 h-40 bg-blue-500/10 rounded-full blur-3xl opacity-50" />
                    </div>

                    {/* ─── Logo ─── */}
                    <div className="flex items-center justify-center h-16 relative shrink-0 overflow-hidden">
                        <motion.div variants={logoVariants} className="absolute left-3">
                            <ThemedLogo variant="wide" className="h-9 w-auto object-contain" />
                        </motion.div>
                        <motion.div variants={compactLogoVariants} className="absolute">
                            <ThemedLogo variant="compact" className="h-8 w-auto object-contain" />
                        </motion.div>
                    </div>

                    {/* ─── Toggle Button ─── */}
                    <button
                        onClick={toggleSidebar}
                        className={cn(
                            "absolute -right-3 top-16 z-[100]",
                            "h-6 w-6 rounded-full flex items-center justify-center",
                            "bg-primary text-primary-foreground shadow-md transition-all duration-200",
                            "opacity-0 group-hover:opacity-100",
                            "hover:scale-110 focus:outline-none ring-2 ring-background"
                        )}
                    >
                        {open ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>

                    {/* ─── Content ─── */}
                    <div className="flex-1 overflow-y-auto overflow-x-hidden py-2 custom-scrollbar">
                        <div className="flex flex-col gap-0.5 px-1.5">
                            {navStructure.map(renderItem)}
                        </div>
                    </div>

                    {/* ─── Footer ─── */}
                    <motion.div
                        animate={{ opacity: open ? 1 : 0 }}
                        className="p-3 flex justify-center shrink-0"
                    >
                        <span className="text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                            v{process.env.NEXT_PUBLIC_APP_VERSION}
                        </span>
                    </motion.div>

                </motion.div>
            </div>

            {/* ═══════════════ MOBILE BOTTOM NAV ═══════════════ */}
            <div className="md:hidden fixed bottom-1 left-0 right-0 z-[100] px-4">
                <div className="bg-background/80 backdrop-blur-xl border border-white/10 rounded-2xl flex flex-row items-center justify-between px-2 py-1 gap-1 shadow-2xl">
                    {/* Render first 5 visible hub items or root items */}
                    {navStructure
                        .flatMap(item => (item.type === 'group' ? (item.children || []) : [item]))
                        .filter(isVisible)
                        .filter(item => item.href && item.href !== '#')
                        .slice(0, 5)
                        .map((item) => (
                            <MenuItem
                                key={item.id}
                                href={item.href || "#"}
                                icon={getIcon(item.iconName)}
                                title={item.label}
                                isOpen={false}
                                isActive={pathname.startsWith(item.href || "")}
                                isMobile
                            />
                        ))}

                    {/* Always show settings link if Admin */}
                    {isPartnerAdmin && !navStructure.some(i => i.href === "/partners") && (
                        <MenuItem href="/partners" icon={Globe} title="Platform" isOpen={false} isActive={pathname.includes("/partners")} isMobile />
                    )}
                </div>
            </div>

        </>
    );
};

export default DynamicModuleMenu;
