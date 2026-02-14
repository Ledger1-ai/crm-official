"use client";

import { useEffect, useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { Loader2, Upload, Search, X, Image as ImageIcon, FileVideo, MoreVertical, Trash, Calendar, Type, Maximize2, Sparkles, Globe, Lock, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { generateMediaSEO } from "@/actions/cms/generate-media-seo";

// Types based on our prisma schema
interface MediaItem {
    id: string;
    url: string;
    filename: string;
    mimeType: string;
    size: number;
    width?: number;
    height?: number;
    title?: string;
    caption?: string;
    altText?: string;
    description?: string;
    isPublic: boolean;
    createdAt: string;
}

export default function MediaLibraryPage() {
    const [media, setMedia] = useState<MediaItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [uploading, setUploading] = useState(false);
    const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        fetchMedia();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const fetchMedia = async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/media?search=${search}`);
            const data = await res.json();
            setMedia(data.items || []); // API returns { items, total, totalPages }
        } catch (error) {
            toast.error("Failed to load media");
        } finally {
            setLoading(false);
        }
    };

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        setUploading(true);

        for (const file of acceptedFiles) {
            // Convert to Base64 for immediate preview (limit to small files < 2MB for DB safety)
            // In production: Upload to AWS S3 / Azure Blob / Cloudinary
            let finalUrl = "";

            if (file.size < 2 * 1024 * 1024) {
                finalUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(file);
                });
            } else {
                // Fallback for larger files or mock
                toast.warning(`File ${file.name} is too large for database storage implementation. Using placeholder.`);
                finalUrl = "https://via.placeholder.com/150?text=Large+File";
            }

            // Create db record
            try {
                await fetch("/api/media", {
                    method: "POST",
                    body: JSON.stringify({
                        url: finalUrl,
                        filename: file.name,
                        mimeType: file.type,
                        size: file.size,
                        title: file.name,
                        isPublic: true,
                    }),
                });
            } catch (e) {
                console.error("Upload failed", e);
                toast.error(`Failed to save ${file.name}`);
            }
        }

        setUploading(false);
        fetchMedia();
        toast.success("Assets added");
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleAddUrl = async () => {
        const url = prompt("Enter image or video URL (e.g., from Google or YouTube):");
        if (!url) return;

        // Try to guess mime type or default to image
        const isVideo = url.match(/\.(mp4|webm|mov)$/i) || url.includes("youtube");
        const mimeType = isVideo ? "video/mp4" : "image/jpeg";

        setUploading(true);
        try {
            await fetch("/api/media", {
                method: "POST",
                body: JSON.stringify({
                    url,
                    filename: "External Link",
                    mimeType,
                    size: 0,
                    title: "External Asset",
                }),
            });
            fetchMedia();
            toast.success("External link added");
        } catch (e) {
            toast.error("Failed to add link");
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

    // Handle Metadata Update
    const updateMetadata = async (id: string, updates: Partial<MediaItem>) => {
        try {
            // Optimistic update
            setMedia(media.map(m => m.id === id ? { ...m, ...updates } : m));
            if (selectedItem?.id === id) setSelectedItem({ ...selectedItem, ...updates });

            await fetch("/api/media", {
                method: "PUT",
                body: JSON.stringify({ id, ...updates }),
            });
            toast.success("Saved");
        } catch (error) {
            toast.error("Failed to save");
            fetchMedia(); // Revert
        }
    };

    const handleGenerateSEO = async () => {
        if (!selectedItem) return;
        setIsGenerating(true);
        try {
            const result = await generateMediaSEO(selectedItem.filename, selectedItem.description);
            await updateMetadata(selectedItem.id, {
                title: result.title,
                altText: result.altText,
                caption: result.caption,
                description: result.description,
            });
            toast.success("SEO Metadata Generated!");
        } catch (error) {
            toast.error("Failed to generate SEO");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyUrl = () => {
        if (!selectedItem?.url) return;
        navigator.clipboard.writeText(selectedItem.url);
        toast.success("URL Copied to clipboard");
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This cannot be undone.")) return;
        try {
            await fetch(`/api/media?id=${id}`, { method: "DELETE" });
            setMedia(media.filter(m => m.id !== id));
            if (selectedItem?.id === id) setSelectedItem(null);
            toast.success("Deleted");
        } catch (error) {
            toast.error("Failed to delete");
        }
    };

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    return (
        <div className="flex h-full min-h-[calc(100vh-64px)] overflow-hidden">
            {/* Main Content: Upload + Grid */}
            <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">Media Library</h1>
                        <p className="text-slate-400 mt-1">Manage all your images, videos, and assets.</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex bg-slate-900 border border-white/10 rounded-lg p-1">
                            <button
                                onClick={() => setViewMode("grid")}
                                className={cn("p-2 rounded-md transition-all", viewMode === "grid" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                                title="Grid View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" /></svg>
                            </button>
                            <button
                                onClick={() => setViewMode("list")}
                                className={cn("p-2 rounded-md transition-all", viewMode === "list" ? "bg-slate-800 text-white shadow-sm" : "text-slate-400 hover:text-white")}
                                title="List View"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" /></svg>
                            </button>
                        </div>
                        <button
                            onClick={handleAddUrl}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                            <Search className="h-4 w-4" /> Add Link
                        </button>
                    </div>
                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search assets..."
                            className="w-full bg-slate-900/50 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 transition-colors"
                        />
                    </div>
                </div>

                {/* Upload Zone */}
                <div
                    {...getRootProps()}
                    className={cn(
                        "border-2 border-dashed border-white/10 rounded-2xl p-8 mb-8 text-center transition-all cursor-pointer group",
                        isDragActive ? "border-blue-500/50 bg-blue-500/5 text-blue-400" : "hover:border-white/20 hover:bg-white/5",
                        uploading && "pointer-events-none opacity-50"
                    )}
                >
                    <input {...getInputProps()} />
                    {uploading ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <p className="text-sm font-medium">Uploading assets...</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <div className="h-12 w-12 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="h-6 w-6 text-slate-400 group-hover:text-white" />
                            </div>
                            <p className="text-sm font-medium text-slate-300">
                                {isDragActive ? "Drop files here" : "Drag & drop files or click to upload"}
                            </p>
                            <p className="text-xs text-slate-500">Supports JPG, PNG, WEBP, MP4, WEBM, PDF</p>
                        </div>
                    )}
                </div>

                {/* Media Content */}
                {loading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                    </div>
                ) : (
                    <>
                        {viewMode === "grid" ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-20">
                                {media.map((item) => (
                                    <div
                                        key={item.id}
                                        onClick={() => setSelectedItem(item)}
                                        className={cn(
                                            "group relative aspect-square rounded-xl overflow-hidden cursor-pointer border transition-all",
                                            selectedItem?.id === item.id
                                                ? "border-blue-500 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10 z-10 scale-[1.02]"
                                                : "border-white/5 hover:border-white/20 bg-slate-900/50"
                                        )}
                                    >
                                        {/* Media Preview */}
                                        {item.mimeType.startsWith("video/") || item.filename.endsWith(".webm") || item.filename.endsWith(".mp4") ? (
                                            <video src={item.url} className="w-full h-full object-cover" muted loop onMouseOver={(e) => e.currentTarget.play()} onMouseOut={(e) => e.currentTarget.pause()} />
                                        ) : item.mimeType === "application/pdf" || item.filename.endsWith(".pdf") ? (
                                            <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-slate-500 group-hover:bg-slate-800 transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-2"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><path d="M12 18v-6" /><path d="m9 15 3 3 3-3" /></svg>
                                                <span className="text-[10px] uppercase font-semibold">PDF Document</span>
                                            </div>
                                        ) : (
                                            <img
                                                src={item.url}
                                                alt={item.altText || item.filename}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                                loading="lazy"
                                            />
                                        )}

                                        {/* Overlay info */}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <p className="text-xs font-medium text-white truncate">{item.title || item.filename}</p>
                                            <p className="text-[10px] text-slate-400 uppercase">{item.mimeType.split("/")[1]}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-slate-900/50 border border-white/5 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-[#0A0A0B] text-slate-400 font-medium">
                                        <tr>
                                            <th className="px-4 py-3 border-b border-white/5">Asset</th>
                                            <th className="px-4 py-3 border-b border-white/5">Type</th>
                                            <th className="px-4 py-3 border-b border-white/5">Size</th>
                                            <th className="px-4 py-3 border-b border-white/5">Uploaded</th>
                                            <th className="px-4 py-3 border-b border-white/5"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {media.map((item) => (
                                            <tr
                                                key={item.id}
                                                onClick={() => setSelectedItem(item)}
                                                className={cn(
                                                    "cursor-pointer hover:bg-white/5 transition-colors",
                                                    selectedItem?.id === item.id ? "bg-blue-500/10" : ""
                                                )}
                                            >
                                                <td className="px-4 py-3 flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded bg-slate-800 flex-shrink-0 overflow-hidden">
                                                        {item.mimeType.startsWith("image/") ? (
                                                            <img src={item.url} alt={item.altText || item.filename} className="h-full w-full object-cover" />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center">
                                                                <Type className="h-5 w-5 text-slate-500" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <span className="text-slate-200 font-medium truncate max-w-[200px]">{item.filename}</span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-400 uppercase text-xs">{item.mimeType.split("/")[1]}</td>
                                                <td className="px-4 py-3 text-slate-400 text-xs">{(item.size / 1024).toFixed(1)} KB</td>
                                                <td className="px-4 py-3 text-slate-400 text-xs">{new Date(item.createdAt).toLocaleDateString()}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} className="p-1 hover:text-red-400 text-slate-500">
                                                        <Trash className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Editing Sidebar (Right Panel) */}
            {selectedItem && (
                <aside className="w-80 border-l border-white/10 bg-[#0F1115] h-full overflow-y-auto z-20 transition-all flex flex-col">
                    <div className="p-6 space-y-6 flex-1">
                        <div className="flex items-start justify-between">
                            <h2 className="text-lg font-semibold text-white">Details</h2>
                            <button onClick={() => setSelectedItem(null)} className="p-1 hover:bg-white/10 rounded-md transition-colors">
                                <X className="h-4 w-4 text-slate-400" />
                            </button>
                        </div>

                        {/* Preview in Sidebar */}
                        <div className="aspect-video rounded-lg overflow-hidden bg-slate-900 border border-white/10 flex items-center justify-center group relative">
                            {selectedItem.mimeType.startsWith("video/") || selectedItem.filename.endsWith(".webm") ? (
                                <video src={selectedItem.url} controls className="w-full h-full object-contain" />
                            ) : (
                                <img src={selectedItem.url} alt="Preview" className="w-full h-full object-contain" />
                            )}
                            <a href={selectedItem.url} target="_blank" className="absolute top-2 right-2 p-1.5 bg-black/50 backdrop-blur rounded hover:bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition-all">
                                <Maximize2 className="h-3.5 w-3.5" />
                            </a>
                        </div>

                        {/* IMPROVE TASK AI BUTTON - Prominent */}
                        <button
                            onClick={handleGenerateSEO}
                            disabled={isGenerating}
                            className={cn(
                                "w-full py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold text-sm transition-all shadow-lg shadow-purple-900/20",
                                "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white",
                                isGenerating ? "opacity-75 cursor-not-allowed" : "hover:shadow-purple-500/20 hover:scale-[1.02]"
                            )}
                        >
                            {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                            {isGenerating ? "Generating..." : "Improve Task with AI"}
                        </button>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => updateMetadata(selectedItem.id, { isPublic: !selectedItem.isPublic })}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-colors border",
                                    selectedItem.isPublic
                                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                                        : "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20"
                                )}
                            >
                                {selectedItem.isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                {selectedItem.isPublic ? "Public" : "Private"}
                            </button>
                            <button
                                onClick={handleCopyUrl}
                                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors border border-white/10 text-xs font-medium"
                            >
                                <Copy className="h-3.5 w-3.5" /> URL
                            </button>
                        </div>

                        {/* Metadata Form */}
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                                    <Type className="h-3 w-3" /> Title
                                </label>
                                <input
                                    value={selectedItem.title || ""}
                                    onChange={(e) => updateMetadata(selectedItem.id, { title: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                                    placeholder="Media title..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                                    <ImageIcon className="h-3 w-3" /> Alt Text
                                </label>
                                <input
                                    value={selectedItem.altText || ""}
                                    onChange={(e) => updateMetadata(selectedItem.id, { altText: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50"
                                    placeholder="Descriptive text..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400 flex items-center gap-2">
                                    <MoreVertical className="h-3 w-3" /> Caption
                                </label>
                                <textarea
                                    value={selectedItem.caption || ""}
                                    onChange={(e) => updateMetadata(selectedItem.id, { caption: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 min-h-[60px]"
                                    placeholder="Caption..."
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-slate-400">Description</label>
                                <textarea
                                    value={selectedItem.description || ""}
                                    onChange={(e) => updateMetadata(selectedItem.id, { description: e.target.value })}
                                    className="w-full bg-slate-900/50 border border-white/10 rounded-md px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500/50 min-h-[80px]"
                                    placeholder="Internal notes..."
                                />
                            </div>
                        </div>

                        {/* File Info */}
                        <div className="bg-slate-900/50 rounded-lg p-4 space-y-2 text-xs text-slate-400 border border-white/5">
                            <div className="flex justify-between">
                                <span>Size</span>
                                <span className="text-slate-300">{(selectedItem.size / 1024).toFixed(1)} KB</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Date</span>
                                <span className="text-slate-300">
                                    {new Date(selectedItem.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 text-center">
                            <p className="text-[10px] text-slate-600">ID: {selectedItem.id}</p>
                        </div>
                    </div>

                    <div className="p-4 border-t border-white/10">
                        <button
                            onClick={() => handleDelete(selectedItem.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors text-sm font-medium"
                        >
                            <Trash className="h-4 w-4" /> Delete Asset
                        </button>
                    </div>
                </aside>
            )}
        </div>
    );
}
