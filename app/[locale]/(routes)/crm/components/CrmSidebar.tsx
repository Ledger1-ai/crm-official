"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    PieChart,
    Building2,
    Contact,
    Users,
    Phone,
    Target,
    FileText,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

export default function CrmSidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("crm-sidebar-collapsed");
        if (stored) {
            setIsCollapsed(stored === "true");
        }
    }, []);

    // Dispatch event when mobile expansion changes
    useEffect(() => {
        const event = new CustomEvent('crm-layer2-change', { detail: { expanded: isMobileExpanded } });
        window.dispatchEvent(event);
    }, [isMobileExpanded]);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("crm-sidebar-collapsed", String(newState));
    };

    const navItems = [
        { label: "Overview", href: "/crm/sales-command", icon: LayoutDashboard },
        { label: "Accounts", href: "/crm/accounts", icon: Building2 },
        { label: "Contacts", href: "/crm/contacts", icon: Contact },
        { label: "Contracts", href: "/crm/contracts", icon: FileText },
        { label: "Dialer", href: "/crm/dialer", icon: Phone },
        { label: "Leads Manager", href: "/crm/leads", icon: Users },
        { label: "Opportunities", href: "/crm/opportunities", icon: Target },
    ];

    // Hide CrmSidebar on /crm/university as it has its own layout
    const isUniversityPage = pathname.includes("/crm/university");
    if (isUniversityPage) {
        return null;
    }

    return (
        <>
            {/* Wrapper for sidebar + toggle button */}
            <div
                className={cn(
                    "hidden md:flex shrink-0 relative group z-20",
                    isCollapsed ? "w-16" : "w-48"
                )}
            >
                {/* Sidebar content */}
                <div
                    className={cn(
                        "flex flex-col bg-muted/10 border-r border-border/50 py-4 gap-1 transition-all duration-300 overflow-y-auto h-full w-full",
                        isCollapsed ? "items-center" : ""
                    )}
                >


                    {navItems.map((item) => {
                        // Improved active state logic
                        const isActive =
                            item.href === "/crm"
                                ? pathname === "/crm"
                                : pathname.startsWith(item.href);

                        return (
                            <button
                                key={item.label}
                                onClick={() => router.push(item.href)}
                                className={cn(
                                    "flex items-center gap-3 text-sm font-medium transition-all text-left relative rounded-lg",
                                    isActive
                                        ? "bg-primary/10 text-primary border-r-2 border-primary"
                                        : "text-muted-foreground hover:bg-muted/20 hover:text-foreground",
                                    isCollapsed
                                        ? "w-9 h-9 justify-center hover:ring-1 hover:ring-primary/50 mx-auto"
                                        : "px-4 py-2 w-full"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {!isCollapsed && <span className="truncate">{item.label}</span>}
                            </button>
                        );
                    })}
                </div>

                {/* Toggle Button - Outside overflow container */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-6 bg-background/60 backdrop-blur-xl border border-border rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-[100]"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Mobile Stacked Bottom Nav (Layer 2) */}
            <div
                className={cn(
                    "md:hidden fixed bottom-[80px] left-0 right-0 bg-muted/10 backdrop-blur supports-[backdrop-filter]:bg-muted/60 border-t border-border/50 flex items-center justify-around z-50 px-2 shadow-sm overflow-x-auto overflow-y-hidden no-scrollbar transition-all duration-300",
                    isMobileExpanded ? "h-14" : "h-12"
                )}
                onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            >
                {navItems.map((item) => {
                    const isActive =
                        item.href === "/crm"
                            ? pathname === "/crm"
                            : pathname.startsWith(item.href);

                    return (
                        <button
                            key={item.label}
                            onClick={(e) => {
                                e.stopPropagation(); // Prevent container click
                                if (!isMobileExpanded) {
                                    setIsMobileExpanded(true);
                                    return;
                                }
                                router.push(item.href);
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[60px] gap-0.5 transition-colors relative rounded-md",
                                isMobileExpanded ? "h-10 justify-center" : "h-full justify-center",
                                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-4 h-4" />

                            {/* Label - Only visible when expanded */}
                            <span className={cn(
                                "text-[9px] uppercase tracking-wider font-semibold truncate max-w-full px-1 transition-all duration-200",
                                isMobileExpanded ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
                            )}>
                                {item.label.split(' ')[0]}
                            </span>

                            {/* Top Cursor Animation */}
                            {isActive && (
                                <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full" />
                            )}
                        </button>
                    );
                })}
            </div>
        </>
    );
}
