"use client";

import * as React from "react";
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
    UserCircle,
    Command as CommandIcon
} from "lucide-react";
import { globalSearch, SearchResult } from "@/actions/dashboard/global-search";
import { useRouter } from "next/navigation";
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function GlobalSearchDialog() {
    const [open, setOpen] = React.useState(false);
    const [query, setQuery] = React.useState("");
    const [results, setResults] = React.useState<SearchResult[]>([]);
    const [loading, setLoading] = React.useState(false);
    const router = useRouter();

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    React.useEffect(() => {
        if (!open) {
            setQuery("");
            setResults([]);
        }
    }, [open]);

    const handleSearch = async (val: string) => {
        setQuery(val);
        if (val.length < 2) {
            setResults([]);
            return;
        }
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

    const getEntityInfo = (type: SearchResult['type']) => {
        switch (type) {
            case "opportunity": return { icon: Target, color: "text-orange-500", label: "Opportunity" };
            case "account": return { icon: Building2, color: "text-blue-500", label: "Account" };
            case "contact": return { icon: Users, color: "text-green-500", label: "Contact" };
            case "lead": return { icon: Zap, color: "text-yellow-500", label: "Lead" };
            case "contract": return { icon: FileText, color: "text-purple-500", label: "Contract" };
            case "invoice": return { icon: Receipt, color: "text-pink-500", label: "Invoice" };
            case "document": return { icon: File, color: "text-gray-500", label: "Document" };
            case "project": return { icon: LayoutDashboard, color: "text-indigo-500", label: "Project" };
            case "task": return { icon: CheckSquare, color: "text-cyan-500", label: "Task" };
            case "user": return { icon: UserCircle, color: "text-rose-500", label: "User" };
            default: return { icon: Search, color: "text-gray-400", label: "Result" };
        }
    };

    // Group results by type
    const groupedResults = results.reduce((acc, result) => {
        if (!acc[result.type]) acc[result.type] = [];
        acc[result.type].push(result);
        return acc;
    }, {} as Record<string, SearchResult[]>);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground border rounded-full bg-background/50 hover:bg-background transition-colors w-full max-w-[200px] md:max-w-[300px]"
            >
                <Search className="h-4 w-4" />
                <span className="flex-1 text-left truncate">Search...</span>
                <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <CommandDialog open={open} onOpenChange={setOpen}>
                <div className="flex items-center border-b px-3">
                    <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                    <input
                        className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Search leads, accounts, projects..."
                        value={query}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                    {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
                </div>
                <CommandList className="max-h-[450px]">
                    {query.length < 2 && (
                        <div className="py-12 text-center text-sm text-muted-foreground">
                            <CommandIcon className="h-12 w-12 mx-auto mb-4 opacity-10" />
                            <p>Search across your entire CRM</p>
                            <p className="text-xs opacity-50">Type at least 2 characters to begin</p>
                        </div>
                    )}

                    {query.length >= 2 && results.length === 0 && !loading && (
                        <CommandEmpty>No results found for "{query}".</CommandEmpty>
                    )}

                    {Object.entries(groupedResults).map(([type, items]) => {
                        const info = getEntityInfo(type as SearchResult['type']);
                        return (
                            <CommandGroup key={type} heading={info.label + "s"}>
                                {items.map((item) => (
                                    <CommandItem
                                        key={item.id}
                                        onSelect={() => {
                                            router.push(item.url);
                                            setOpen(false);
                                        }}
                                        className="flex items-center gap-3 px-4 py-2 cursor-pointer"
                                    >
                                        <div className={cn("flex items-center justify-center h-8 w-8 rounded-full bg-accent", info.color)}>
                                            <info.icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="text-sm font-medium truncate">{item.title}</div>
                                            {item.subtitle && (
                                                <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                                            )}
                                        </div>
                                        <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100" />
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        );
                    })}

                    {query.length >= 2 && results.length > 0 && (
                        <>
                            <CommandSeparator />
                            <div className="p-2">
                                <Link
                                    href={`/fulltext-search?q=${query}`}
                                    onClick={() => setOpen(false)}
                                    className="flex items-center justify-center gap-2 py-2 text-xs text-primary hover:underline"
                                >
                                    View all results for "{query}"
                                    <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        </>
                    )}
                </CommandList>
            </CommandDialog>
        </>
    );
}
