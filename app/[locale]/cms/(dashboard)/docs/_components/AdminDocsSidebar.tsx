"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BookOpen, Plus, FileText, ChevronRight, Settings } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface DocArticle {
    id: string;
    title: string;
    slug: string;
    category: string;
    order: number;
}

interface AdminDocsSidebarProps {
    docs: DocArticle[];
    locale: string;
}

export default function AdminDocsSidebar({ docs, locale }: AdminDocsSidebarProps) {
    const pathname = usePathname();

    // Group by category
    const docsByCategory: Record<string, DocArticle[]> = {};
    docs.forEach((doc) => {
        if (!docsByCategory[doc.category]) {
            docsByCategory[doc.category] = [];
        }
        docsByCategory[doc.category].push(doc);
    });

    return (
        <div className="flex flex-col h-full w-full bg-card/50 border-r border-border/40">
            {/* Header */}
            <div className="p-6 border-b border-border/40">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-primary">
                        <BookOpen className="h-5 w-5" />
                        <span className="font-bold text-lg tracking-tight">Help Hub</span>
                    </div>
                </div>
                <Link href={`/${locale}/cms/docs/new`}>
                    <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 border border-blue-500/50 transition-all hover:scale-[1.02] active:scale-[0.98]">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Article
                    </Button>
                </Link>
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1 px-4 py-6">
                <div className="space-y-8">
                    {/* Dashboard Link */}
                    <div>
                        <Link
                            href={`/${locale}/cms/docs`}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors",
                                pathname === `/${locale}/cms/docs`
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <Settings className="h-4 w-4" />
                            Overview & Stats
                        </Link>
                    </div>

                    {Object.entries(docsByCategory).map(([category, articles]) => (
                        <div key={category}>
                            <h3 className="px-3 text-xs font-semibold text-muted-foreground/70 uppercase tracking-wider mb-2">
                                {category}
                            </h3>
                            <div className="space-y-1">
                                {articles.map((doc) => {
                                    const isActive = pathname === `/${locale}/cms/docs/${doc.id}`;
                                    return (
                                        <Link
                                            key={doc.id}
                                            href={`/${locale}/cms/docs/${doc.id}`}
                                            className={cn(
                                                "group flex items-center justify-between px-3 py-2 text-sm rounded-md transition-all duration-200 border border-transparent",
                                                isActive
                                                    ? "bg-gradient-to-r from-primary/10 to-transparent text-primary font-medium border-l-primary/50"
                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground hover:translate-x-1"
                                            )}
                                        >
                                            <span className="truncate">{doc.title}</span>
                                            {isActive && <ChevronRight className="h-3 w-3 opacity-50" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>

            {/* Footer Stats */}
            <div className="p-4 border-t border-border/40 bg-muted/20">
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Total Articles</span>
                    <Badge variant="outline" className="bg-background/50">{docs.length}</Badge>
                </div>
            </div>
        </div>
    );
}
