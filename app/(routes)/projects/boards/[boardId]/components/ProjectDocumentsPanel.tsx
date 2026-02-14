"use client";

import React, { useMemo, useState } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import { Button } from "@/components/ui/button";
import UploadFileModal from "@/components/modals/upload-file-modal";
import { toast } from "react-hot-toast";
import { Upload, FileText, ExternalLink, Search, Grid, List, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = { boardId: string };

// SWR hook for documents by project
function useProjectDocuments(boardId: string) {
    const { data, error, isLoading, mutate } = useSWR<{ documents: any[] }>(
        boardId ? `/api/projects/${boardId}/documents` : null,
        fetcher,
        { refreshInterval: 60000 }
    );
    return { docs: data?.documents ?? [], error, isLoading, mutate };
}

export default function ProjectDocumentsPanel({ boardId }: Props) {
    const { docs, isLoading, mutate: refreshDocs } = useProjectDocuments(boardId);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"grid" | "list">("list");

    const filteredDocs = useMemo(() => {
        if (!searchQuery.trim()) return docs;
        const q = searchQuery.toLowerCase();
        return docs.filter((d: any) =>
            (d.document_name || "").toLowerCase().includes(q) ||
            (d.document_type || "").toLowerCase().includes(q)
        );
    }, [docs, searchQuery]);

    const isImage = (url: string) => /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(url);

    const handleDelete = async (docId: string) => {
        if (!confirm("Delete this document?")) return;
        try {
            const res = await fetch(`/api/documents/${docId}`, { method: "DELETE" });
            if (!res.ok) throw new Error(await res.text());
            toast.success("Document deleted");
            refreshDocs();
        } catch (err: any) {
            toast.error(err?.message || "Delete failed");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header with stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Documents</h2>
                    <p className="text-muted-foreground">
                        {docs.length} document{docs.length !== 1 ? "s" : ""} in this project
                    </p>
                </div>
                <Button onClick={() => setUploadOpen(true)} className="gap-2">
                    <Upload className="w-4 h-4" />
                    Upload Document
                </Button>
            </div>

            {/* Search and View Toggle */}
            <div className="flex items-center gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search documents..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center border rounded-md p-1 bg-muted/50">
                    <button
                        onClick={() => setViewMode("list")}
                        className={`p-1.5 rounded-sm transition-all ${viewMode === "list" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <List className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("grid")}
                        className={`p-1.5 rounded-sm transition-all ${viewMode === "grid" ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
                    >
                        <Grid className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Upload Modal */}
            <UploadFileModal isOpen={uploadOpen} onClose={() => setUploadOpen(false)} title="Upload Document">
                <form
                    className="space-y-4"
                    onSubmit={async (e) => {
                        e.preventDefault();
                        const input = e.currentTarget.querySelector("input[type=file]") as HTMLInputElement;
                        const file = input?.files?.[0];
                        if (!file) { toast.error("Select a file"); return; }
                        try {
                            const form = new FormData();
                            form.append("file", file);
                            const res = await fetch(`/api/projects/${boardId}/upload-document`, {
                                method: "POST",
                                body: form,
                            });
                            if (!res.ok) throw new Error(await res.text());
                            toast.success("Document uploaded");
                            setUploadOpen(false);
                            refreshDocs();
                        } catch (err: any) {
                            toast.error(err?.message || "Upload failed");
                        }
                    }}
                >
                    <div
                        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => (document.querySelector('input[type=file]') as HTMLInputElement)?.click()}
                    >
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">Click to select or drag and drop</p>
                    </div>
                    <input type="file" className="hidden" />
                    <div className="flex justify-end">
                        <Button type="submit">Upload</Button>
                    </div>
                </form>
            </UploadFileModal>

            {/* Loading State */}
            {isLoading && (
                <div className="flex items-center justify-center p-12 text-muted-foreground">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mr-3" />
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
                            {searchQuery ? "Try adjusting your search" : "Upload your first document to get started."}
                        </p>
                        {!searchQuery && (
                            <Button onClick={() => setUploadOpen(true)} className="gap-2">
                                <Upload className="h-4 w-4" />
                                Upload Document
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Documents Grid View */}
            {!isLoading && filteredDocs.length > 0 && viewMode === "grid" && (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filteredDocs.map((doc: any) => (
                        <Card
                            key={doc.id}
                            className="group hover:shadow-lg hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                        >
                            <CardContent className="p-4">
                                <div className="aspect-square rounded-lg bg-muted/50 flex items-center justify-center mb-3 overflow-hidden">
                                    {doc.document_file_url && isImage(doc.document_file_url) ? (
                                        <img src={doc.document_file_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <FileText className="h-12 w-12 text-muted-foreground" />
                                    )}
                                </div>
                                <h4 className="font-medium text-sm truncate">{doc.document_name || "Untitled"}</h4>
                                <p className="text-xs text-muted-foreground truncate">{doc.document_type || "File"}</p>
                                <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {doc.document_file_url && (
                                        <a href={doc.document_file_url} target="_blank" rel="noreferrer" className="text-primary text-xs flex items-center gap-1 hover:underline">
                                            <ExternalLink className="h-3 w-3" /> Open
                                        </a>
                                    )}
                                    <button onClick={() => handleDelete(doc.id)} className="text-destructive text-xs flex items-center gap-1 hover:underline ml-auto">
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Documents List View */}
            {!isLoading && filteredDocs.length > 0 && viewMode === "list" && (
                <div className="rounded-xl border border-border/50 overflow-hidden bg-background/50">
                    <table className="w-full text-sm">
                        <thead className="bg-muted/50 border-b border-border/50">
                            <tr>
                                <th className="text-left p-4 font-medium text-muted-foreground">Name</th>
                                <th className="text-left p-4 font-medium text-muted-foreground hidden md:table-cell">Type</th>
                                <th className="text-left p-4 font-medium text-muted-foreground hidden lg:table-cell">Owner</th>
                                <th className="text-right p-4 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                            {filteredDocs.map((doc: any) => (
                                <tr key={doc.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden shrink-0">
                                                {doc.document_file_url && isImage(doc.document_file_url) ? (
                                                    <img src={doc.document_file_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                )}
                                            </div>
                                            <span className="font-medium truncate">{doc.document_name || "Untitled"}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                                        <Badge variant="outline" className="text-xs">{doc.document_type || "File"}</Badge>
                                    </td>
                                    <td className="p-4 text-muted-foreground hidden lg:table-cell">{doc.assigned_to_user?.email || "—"}</td>
                                    <td className="p-4">
                                        <div className="flex items-center justify-end gap-2">
                                            {doc.document_file_url && (
                                                <a href={doc.document_file_url} target="_blank" rel="noreferrer" className="text-primary text-xs flex items-center gap-1 hover:underline">
                                                    <ExternalLink className="h-3 w-3" /> Open
                                                </a>
                                            )}
                                            <button onClick={() => handleDelete(doc.id)} className="text-destructive text-xs flex items-center gap-1 hover:underline">
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
