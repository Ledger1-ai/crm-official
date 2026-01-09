"use client";

import { useState, useRef, useEffect } from "react";
import {
    Search,
    Loader2,
    ArrowRight,
    Target,
    Building2,
    Users,
    FileText,
    Receipt,
    File,
    Zap,
    LayoutDashboard,
    CheckSquare,
    UserCircle
} from "lucide-react";
import { globalSearch, SearchResult } from "@/actions/dashboard/global-search";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function GlobalSearchWidget() {
    const [showResults, setShowResults] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Close when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            setShowResults(false);
            return;
        }
        setShowResults(true);
        setLoading(true);
        try {
            const res = await globalSearch(val);
            setResults(res);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            setShowResults(false);
            router.push(`/fulltext-search?q=${query}`);
        }
    }

    // Helper to get Icon and Color based on type
    const getEntityInfo = (type: SearchResult['type']) => {
        switch (type) {
            case "opportunity": return { icon: Target, color: "bg-orange-500", label: "Opportunity" };
            case "account": return { icon: Building2, color: "bg-blue-500", label: "Account" };
            case "contact": return { icon: Users, color: "bg-green-500", label: "Contact" };
            case "lead": return { icon: Zap, color: "bg-yellow-500", label: "Lead" };
            case "contract": return { icon: FileText, color: "bg-purple-500", label: "Contract" };
            case "invoice": return { icon: Receipt, color: "bg-pink-500", label: "Invoice" };
            case "document": return { icon: File, color: "bg-gray-500", label: "Document" };
            case "project": return { icon: LayoutDashboard, color: "bg-indigo-500", label: "Project" };
            case "task": return { icon: CheckSquare, color: "bg-cyan-500", label: "Task" };
            case "user": return { icon: UserCircle, color: "bg-rose-500", label: "User" };
            default: return { icon: Search, color: "bg-gray-400", label: "Result" };
        }
    };

    return (
        <div ref={wrapperRef} className="relative flex items-center w-full max-w-2xl">
            <div className={cn(
                "flex items-center transition-all duration-300 ease-in-out border rounded-full bg-background/50 w-full px-3 py-2 shadow-sm border-gray-800 focus-within:ring-1 focus-within:ring-ring focus-within:border-primary",
            )}>
                <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />

                <input
                    className="!bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50 h-full"
                    placeholder="Search leads, accounts, projects..."
                    value={query}
                    autoComplete="off"
                    onChange={(e) => handleSearch(e.target.value)}
                    onKeyDown={handleEnter}
                    onFocus={() => { if (query.length >= 2) setShowResults(true); }}
                />

                {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/70 shrink-0" />}
            </div>

            {/* Results Dropdown */}
            {showResults && query.length >= 2 && results.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-2">
                        <div className="px-3 pb-2 text-[10px] uppercase font-semibold text-muted-foreground flex justify-between">
                            <span>Top Results</span>
                            <span className="text-[9px] cursor-pointer hover:text-primary" onClick={() => router.push(`/fulltext-search?q=${query}`)}>Press Enter for all</span>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto">
                            {results.map((item) => {
                                const info = getEntityInfo(item.type);
                                return (
                                    <Link
                                        key={`${item.type}-${item.id}`}
                                        href={item.url}
                                        className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer group"
                                        onClick={() => {
                                            setQuery(""); // Clear on selection
                                            setResults([]);
                                            setShowResults(false);
                                        }}
                                    >
                                        <div className={cn("shrink-0 w-1 h-8 rounded-full transition-all group-hover:h-full group-hover:w-1", info.color)} />

                                        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-accent text-muted-foreground shrink-0">
                                            <info.icon className="h-4 w-4" />
                                        </div>

                                        <div className="overflow-hidden flex-1">
                                            <div className="text-sm font-medium truncate">{item.title}</div>
                                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                <span className="capitalize">{info.label}</span>
                                                {item.subtitle && <span>• {item.subtitle}</span>}
                                            </div>
                                        </div>
                                        <ArrowRight className="ml-auto h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                                    </Link>
                                );
                            })}
                        </div>
                        <div className="border-t mt-1 pt-1 text-center">
                            <Link href={`/fulltext-search?q=${query}`} onClick={() => setShowResults(false)} className="text-xs text-primary hover:underline block py-2">
                                View all results for "{query}"
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {showResults && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-popover border rounded-lg shadow-xl z-50 p-4 text-center text-muted-foreground text-sm">
                    No results found.
                </div>
            )}
        </div>
    );
}
