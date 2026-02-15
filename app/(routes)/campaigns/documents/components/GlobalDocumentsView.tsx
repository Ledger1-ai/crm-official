"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Upload,
    FileText,
    ExternalLink,
    Search,
    Grid,
    List,
    FolderOpen,
    Loader2,
} from "lucide-react";
import Link from "next/link";

// Fetch all documents across projects
function useAllDocuments() {
    const { data, error, isLoading, mutate } = useSWR<{ documents: any[] }>(
        "/api/documents",
        fetcher,
        { refreshInterval: 60000 }
    );
    return { docs: data?.documents ?? [], error, isLoading, mutate };
}

export default function GlobalDocumentsView() {
    const { docs, isLoading, mutate } = useAllDocuments();
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");

    const filteredDocs = useMemo(() => {
        if (!searchQuery.trim()) return docs;
        const q = searchQuery.toLowerCase();
        return docs.filter(
            (d: any) =>
                (d.document_name || "").toLowerCase().includes(q) ||
                (d.document_type || "").toLowerCase().includes(q) ||
                (d.assigned_to_board?.title || "").toLowerCase().includes(q)
        );
    }, [docs, searchQuery]);

    const isImage = (url: string) =>
        /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url);

    // Group documents by project
    const docsByProject = useMemo(() => {
        const grouped: Record<string, { project: any; docs: any[] }> = {};
        for (const doc of filteredDocs) {
            const projectId = doc.assigned_to_board?.id || "unassigned";
            if (!grouped[projectId]) {
                grouped[projectId] = {
                    project: doc.assigned_to_board || { id: "unassigned", title: "Unassigned" },
                    docs: [],
                };
            }
            grouped[projectId].docs.push(doc);
        }
        return Object.values(grouped);
    }, [filteredDocs]);

    return (
        <div className="space-y-6 py-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/20 rounded-lg">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{docs.length}</p>
                            <p className="text-xs text-muted-foreground">Total Documents</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <FolderOpen className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{docsByProject.length}</p>
                            <p className="text-xs text-muted-foreground">Projects with Docs</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/20 rounded-lg">
                            <Upload className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Upload documents from individual project pages
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and View Toggle */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents or campaigns..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center border rounded-md p-1 bg-muted/50">
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded-sm transition-all ${viewMode === "list"
                            ? "bg-background shadow-sm text-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded-sm transition-all ${viewMode === "grid"
                            ? "bg-background shadow-sm text-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Grid className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center p-12 text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mr-3" />
                    Loading documents...
                </div>
            )}

            {/* Empty State */}
            {!isLoading && filteredDocs.length === 0 && (
                <Card className="border-dashed">
                    <CardContent className="py-16 text-center">
                        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                            <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">
                            {searchQuery ? "No documents match your search" : "No documents yet"}
                        </h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                            {searchQuery
                                ? "Try adjusting your search"
                                : "Upload documents from individual campaign pages."}
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Documents grouped by project */}
            {!isLoading &&
                filteredDocs.length > 0 &&
                docsByProject.map((group) => (
                    <div key={group.project.id} className="space-y-3">
                        <div className="flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-primary" />
                            <h3 className="font-semibold">{group.project.title}</h3>
                            <Badge variant="outline" className="text-xs">
                                {group.docs.length}
                            </Badge>
                            {group.project.id !== "unassigned" && (
                                <Link
                                    href={`/campaigns/boards/${group.project.id}?view=documents`}
                                    className="text-primary text-xs hover:underline ml-auto"
                                >
                                    View Project →
                                </Link>
                            )}
                        </div>

                        {viewMode === "grid" ? (
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                {group.docs.map((doc: any) => (
                                    <Card
                                        key={doc.id}
                                        className="group hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        <CardContent className="p-3">
                                            <div className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center mb-2 overflow-hidden">
                                                {doc.document_file_url && isImage(doc.document_file_url) ? (
                                                    <img
                                                        src={doc.document_file_url}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <FileText className="h-10 w-10 text-muted-foreground" />
                                                )}
                                            </div>
                                            <h4 className="font-medium text-xs truncate">
                                                {doc.document_name || "Untitled"}
                                            </h4>
                                            {doc.document_file_url && (
                                                <a
                                                    href={doc.document_file_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-primary text-xs flex items-center gap-1 hover:underline mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <ExternalLink className="h-3 w-3" /> Open
                                                </a>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-border/50">
                                        {group.docs.map((doc: any) => (
                                            <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                                                <td className="p-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                                                            {doc.document_file_url && isImage(doc.document_file_url) ? (
                                                                <img
                                                                    src={doc.document_file_url}
                                                                    alt=""
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            ) : (
                                                                <FileText className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <span className="font-medium truncate">
                                                            {doc.document_name || "Untitled"}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="p-3 text-muted-foreground hidden md:table-cell">
                                                    <Badge variant="outline" className="text-xs">
                                                        {doc.document_type || "File"}
                                                    </Badge>
                                                </td>
                                                <td className="p-3 text-right">
                                                    {doc.document_file_url && (
                                                        <a
                                                            href={doc.document_file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-primary text-xs flex items-center gap-1 hover:underline justify-end"
                                                        >
                                                            <ExternalLink className="h-3 w-3" /> Open
                                                        </a>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ))}
        </div>
    );
}
