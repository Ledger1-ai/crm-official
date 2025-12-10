"use client";

import { useCallback, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { FolderKanban, BarChart2, Settings, ChevronLeft, ChevronRight } from "lucide-react";
import Heading from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";

type Props = {
    title: string;
    description: string;
    visibility?: string;
    kanbanSlot: React.ReactNode;
    ganttSlot: React.ReactNode;
    settingsSlot: React.ReactNode;
    headerSlot?: React.ReactNode;
};

export default function BoardTabsContainer({ title, description, visibility, kanbanSlot, ganttSlot, settingsSlot, headerSlot }: Props) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selected = searchParams.get("view") || "kanban";
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isMobileExpanded, setIsMobileExpanded] = useState(false);
    const [layer2Expanded, setLayer2Expanded] = useState(false);
    const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        const stored = localStorage.getItem("board-sidebar-collapsed");
        if (stored) {
            setIsCollapsed(stored === "true");
        }

        const handleLayer2Change = (e: CustomEvent) => {
            setLayer2Expanded(e.detail.expanded);
        };

        window.addEventListener('crm-layer2-change' as any, handleLayer2Change as any);
        return () => {
            window.removeEventListener('crm-layer2-change' as any, handleLayer2Change as any);
        };
    }, []);

    const toggleSidebar = () => {
        const newState = !isCollapsed;
        setIsCollapsed(newState);
        localStorage.setItem("board-sidebar-collapsed", String(newState));
    };

    const setView = useCallback(
        (value: string) => {
            const sp = new URLSearchParams(searchParams.toString());
            sp.set("view", value);
            router.replace(`?${sp.toString()}`, { scroll: false });
        },
        [router, searchParams]
    );

    const navItems = [
        { id: "kanban", label: "Kanban", icon: FolderKanban },
        { id: "gantt", label: "Gantt", icon: BarChart2 },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    if (!isMounted) return null;

    return (
        <div className="flex flex-col md:flex-row h-full w-full">

            {/* Wrapper for Layer 3 sidebar + toggle button */}
            <div
                className={cn(
                    "hidden md:flex shrink-0 relative group z-10",
                    isCollapsed ? "w-12" : "w-48"
                )}
            >
                {/* Sidebar content */}
                <div
                    className={cn(
                        "flex flex-col bg-muted/30 border-r border-border/50 py-6 gap-2 transition-all duration-300 overflow-y-auto h-full w-full",
                        isCollapsed ? "items-center" : ""
                    )}
                >
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setView(item.id)}
                            onMouseEnter={() => setHoveredLabel(item.label)}
                            onMouseLeave={() => setHoveredLabel(null)}
                            className={cn(
                                "group flex items-center w-full relative transition-all duration-200",
                                isCollapsed ? "justify-center px-0 py-2" : "justify-start px-4 py-2 gap-3",
                                selected === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                            title={isCollapsed ? undefined : item.label}
                        >
                            {/* Active Indicator */}
                            {selected === item.id && (
                                <div className={cn(
                                    "absolute bg-primary rounded-r-full",
                                    isCollapsed ? "left-0 top-1/2 -translate-y-1/2 w-0.5 h-8" : "left-0 top-0 bottom-0 w-1"
                                )} />
                            )}

                            <item.icon className="w-4 h-4 shrink-0 z-10" />

                            {/* Text (Expanded) */}
                            {!isCollapsed && (
                                <span className="text-sm font-medium truncate">{item.label}</span>
                            )}
                        </button>
                    ))}

                    {/* Dynamic Bottom Label (Collapsed Mode) */}
                    {isCollapsed && (
                        <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none">
                            <span
                                className={cn(
                                    "text-[10px] uppercase tracking-widest font-semibold whitespace-nowrap [writing-mode:vertical-rl] rotate-180 transition-opacity duration-200 text-primary",
                                    hoveredLabel ? "opacity-100" : "opacity-0"
                                )}
                            >
                                {hoveredLabel}
                            </span>
                        </div>
                    )}
                </div>

                {/* Toggle Button */}
                <button
                    onClick={toggleSidebar}
                    className="absolute -right-3 top-6 bg-background/60 backdrop-blur-xl border border-border rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-[100]"
                >
                    {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                </button>
            </div>

            {/* Mobile Stacked Bottom Nav (Layer 3) */}
            <div
                className={cn(
                    "md:hidden fixed left-0 right-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/50 flex items-center justify-around z-40 px-2 shadow-sm overflow-y-hidden transition-all duration-300",
                    isMobileExpanded ? "h-16 py-1" : "h-12"
                )}
                style={{ bottom: layer2Expanded ? '136px' : '128px' }}
                onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            >
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (!isMobileExpanded) {
                                    setIsMobileExpanded(true);
                                    return;
                                }
                                setView(item.id);
                            }}
                            className={cn(
                                "flex flex-col items-center justify-center min-w-[60px] gap-0.5 transition-colors relative",
                                isMobileExpanded ? "h-14 justify-end pb-1" : "h-full justify-center",
                                selected === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Icon className="w-4 h-4" />

                            {/* Label */}
                            <span className={cn(
                                "text-[9px] uppercase tracking-wider font-semibold truncate max-w-full px-1 transition-all duration-200",
                                isMobileExpanded ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
                            )}>
                                {item.label}
                            </span>

                            {/* Top Cursor Animation */}
                            {selected === item.id && (
                                <div className="absolute top-0 w-8 h-0.5 bg-primary rounded-b-full" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto h-full flex flex-col bg-background">
                <div className="p-4 md:p-6 lg:p-8 pb-4">
                    <div className="flex items-center gap-4">
                        {headerSlot}
                        <div>
                            <Heading title={title} description={description} visibility={visibility} />
                        </div>
                    </div>
                    <Separator className="mt-4" />
                </div>

                <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8 pt-0 pb-20 md:pb-0">
                    {selected === "kanban" && kanbanSlot}
                    {selected === "gantt" && ganttSlot}
                    {selected === "settings" && settingsSlot}
                </div>
            </div>

        </div>
    );
}
