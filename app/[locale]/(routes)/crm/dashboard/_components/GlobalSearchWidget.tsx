"use client";

import { useState, useRef, useEffect } from "react";
import { Search, Loader2, ArrowRight } from "lucide-react";
import { globalSearch, SearchResult } from "@/actions/dashboard/global-search";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function GlobalSearchWidget() {
    const [showResults, setShowResults] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

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

    return (
        <div ref={wrapperRef} className="relative flex items-center">
            <div className={cn(
                "flex items-center transition-all duration-300 ease-in-out border rounded-full bg-background/50 w-[250px] md:w-[350px] px-3 py-2 shadow-sm border-gray-800 focus-within:ring-1 focus-within:ring-ring focus-within:border-primary",
            )}>
                <Search className="h-4 w-4 text-muted-foreground mr-2 shrink-0" />

                <input
                    className="!bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50 h-full"
                    placeholder="Search tasks, leads, projects..."
                    value={query}
                    autoComplete="off"
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => { if (query.length >= 2) setShowResults(true); }}
                />

                {loading && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/70 shrink-0" />}
            </div>

            {/* Results Dropdown */}
            {showResults && query.length >= 2 && results.length > 0 && (
                <div className="absolute top-full right-0 mt-2 w-full md:w-[450px] bg-popover border rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="py-2">
                        <div className="px-3 pb-2 text-[10px] uppercase font-semibold text-muted-foreground">Results</div>
                        <div className="max-h-[300px] overflow-y-auto">
                            {results.map((item) => (
                                <Link
                                    key={`${item.type}-${item.id}`}
                                    href={item.url}
                                    className="flex items-center gap-3 px-4 py-2 hover:bg-muted/50 transition-colors cursor-pointer"
                                    onClick={() => {
                                        setQuery(""); // Clear on selection
                                        setResults([]);
                                        setShowResults(false);
                                    }}
                                >
                                    <div className={cn("shrink-0 w-1 h-8 rounded-full",
                                        item.type === "task" ? "bg-blue-500" :
                                            item.type === "lead" ? "bg-indigo-500" : "bg-emerald-500"
                                    )} />
                                    <div className="overflow-hidden">
                                        <div className="text-sm font-medium truncate">{item.title}</div>
                                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                                            <span className="capitalize">{item.type}</span>
                                            {item.subtitle && <span>• {item.subtitle}</span>}
                                        </div>
                                    </div>
                                    <ArrowRight className="ml-auto h-3 w-3 opacity-50" />
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {showResults && query.length >= 2 && results.length === 0 && !loading && (
                <div className="absolute top-full right-0 mt-2 w-[250px] bg-popover border rounded-lg shadow-xl z-50 p-4 text-center text-muted-foreground text-sm">
                    No results found.
                </div>
            )}
        </div>
    );
}
