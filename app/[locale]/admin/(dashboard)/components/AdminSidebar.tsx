"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    Package,
    ChevronLeft,
    ChevronRight,
    Mail,
    MessageSquare,
    Bot,
    Building2,
    Shield,
} from "lucide-react";

interface AdminSidebarProps {
    showModules?: boolean;
}

export default function AdminSidebar({ showModules = false }: AdminSidebarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("admin-sidebar-collapsed");
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
        localStorage.setItem("admin-sidebar-collapsed", String(newState));
    };

    const navItems = [
        { label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true },
        { label: "Email Settings", href: "/admin/settings", icon: Mail },
        { label: "SMS Configuration", href: "/admin/sms-config", icon: MessageSquare },
        { label: "AI Settings", href: "/admin/ai-settings", icon: Bot },
        { label: "Captcha Config", href: "/admin/captcha-config", icon: Shield },
        ...(showModules ? [{ label: "Modules", href: "/admin/modules", icon: Package }] : []),
    ];

    if (!isMounted) return null;

    return (
        <>
            {/* Desktop Sidebar */}
            <div
                className={cn(
                    "hidden md:flex shrink-0 relative group z-20",
                    isCollapsed ? "w-16" : "w-56"
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
                        const isActive = item.exact
                            ? pathname === item.href || pathname === `/en${item.href}` || pathname === `/de${item.href}` || pathname === `/cz${item.href}`
                            : pathname.includes(item.href);

                        return (
                            <button
                                key={item.label}
                                onClick={() => router.push(item.href)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2 text-sm font-medium transition-colors text-left w-full relative",
                                    isActive
                                        ? "bg-primary/10 text-primary border-r-2 border-primary"
                                        : "text-muted-foreground hover:bg-muted/20 hover:text-foreground",
                                    isCollapsed && "justify-center px-2"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <item.icon className="w-4 h-4 shrink-0" />
                                {!isCollapsed && (
                                    <span className="truncate">{item.label}</span>
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Toggle Button */}
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
                    const isActive = item.exact
                        ? pathname === item.href || pathname === `/en${item.href}` || pathname === `/de${item.href}` || pathname === `/cz${item.href}`
                        : pathname.includes(item.href);

                    return (
                        <button
                            key={item.label}
                            onClick={(e) => {
                                e.stopPropagation();
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
                                {item.label}
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
