"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Check, X, Wand2, Eye, Edit3, ArrowRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import * as Diff from "diff";

interface AiRevisionPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAccept: (data: any) => void;
    originalData: {
        title: string;
        content: string;
        category: string;
    };
    newData: {
        title?: string;
        content?: string;
        category?: string;
    };
}

export function AiRevisionPreviewModal({
    isOpen,
    onClose,
    onAccept,
    originalData,
    newData
}: AiRevisionPreviewModalProps) {
    const [activeTab, setActiveTab] = useState<"diff" | "edit">("diff");
    const [editableData, setEditableData] = useState({
        title: originalData.title,
        content: originalData.content,
        category: originalData.category
    });

    // Initialize editable data when modal opens or newData changes
    useEffect(() => {
        if (isOpen && newData) {
            setEditableData({
                title: newData.title !== undefined ? newData.title : originalData.title,
                content: newData.content !== undefined ? newData.content : originalData.content,
                category: newData.category !== undefined ? newData.category : originalData.category,
            });
        }
    }, [isOpen, newData, originalData]);

    // Handle acceptance
    const handleAccept = () => {
        onAccept(editableData);
    };

    // --- Diff Logic ---
    const renderContentDiff = () => {
        const original = originalData.content || "";
        const revised = editableData.content || ""; // Use editable as the "new" source to reflect tweaks

        // Tokenize by word for granualarity, or line for readability. Lines are usually better for long docs.
        const diff = Diff.diffLines(original, revised);

        return (
            <div className="font-mono text-xs whitespace-pre-wrap leading-relaxed">
                {diff.map((part, i) => {
                    const color = part.added ? "bg-green-500/20 text-green-300" :
                        part.removed ? "bg-red-500/20 text-red-300 line-through opacity-70" :
                            "text-slate-300";

                    return (
                        <span key={i} className={cn(color, "block")}>
                            {part.value}
                        </span>
                    );
                })}
            </div>
        );
    };

    const hasTitleChange = newData.title && newData.title !== originalData.title;
    const hasCategoryChange = newData.category && newData.category !== originalData.category;


    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl w-full p-0 border-0 bg-transparent shadow-none [&>button]:hidden h-[90vh]">
                <div className="bg-[#0A0A0B] border border-white/10 rounded-3xl w-full h-full shadow-2xl flex flex-col relative overflow-hidden backdrop-blur-xl">
                    {/* Header */}
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/5">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                                <Wand2 className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                                <DialogTitle className="text-lg font-bold text-white">Review AI Changes</DialogTitle>
                                <DialogDescription className="text-slate-400 text-xs">
                                    Compare the original content with the AI's suggestions.
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex bg-black/20 p-1 rounded-lg border border-white/5">
                            <button
                                onClick={() => setActiveTab("diff")}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                                    activeTab === "diff" ? "bg-purple-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Eye className="h-3.5 w-3.5" /> Diff View
                            </button>
                            <button
                                onClick={() => setActiveTab("edit")}
                                className={cn(
                                    "px-4 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-2",
                                    activeTab === "edit" ? "bg-blue-600 text-white shadow-lg" : "text-slate-400 hover:text-white"
                                )}
                            >
                                <Edit3 className="h-3.5 w-3.5" /> Edit Final
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex flex-col relative">
                        {/* Summary of Metadata Changes (Title/Category) */}
                        {(hasTitleChange || hasCategoryChange) && (
                            <div className="bg-purple-500/5 border-b border-purple-500/10 p-4 grid grid-cols-2 gap-8 shrink-0">
                                {hasTitleChange && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold">Title Change</label>
                                        <div className="text-sm flex flex-col gap-1">
                                            <span className="text-red-400 line-through opacity-60 text-xs">{originalData.title}</span>
                                            <div className="flex items-center gap-2 text-green-400 font-medium">
                                                <ArrowRight className="h-3 w-3" />
                                                {newData.title}
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {hasCategoryChange && (
                                    <div className="space-y-1">
                                        <label className="text-[10px] uppercase tracking-wider text-purple-300 font-semibold">Category Change</label>
                                        <div className="text-sm flex flex-col gap-1">
                                            <span className="text-red-400 line-through opacity-60 text-xs">{originalData.category}</span>
                                            <div className="flex items-center gap-2 text-green-400 font-medium">
                                                <ArrowRight className="h-3 w-3" />
                                                {newData.category}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Main Content Area */}
                        <div className="flex-1 overflow-auto bg-black/50 p-6 custom-scrollbar">
                            {activeTab === "diff" ? (
                                <div className="max-w-4xl mx-auto bg-[#0F0F10] border border-white/5 rounded-xl p-6 shadow-inner">
                                    {renderContentDiff()}
                                </div>
                            ) : (
                                <div className="max-w-4xl mx-auto h-full flex flex-col gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-slate-400">Final Title</Label>
                                        <Input
                                            value={editableData.title}
                                            onChange={(e) => setEditableData({ ...editableData, title: e.target.value })}
                                            className="bg-white/5 border-white/10 text-white"
                                        />
                                    </div>
                                    <div className="space-y-2 flex-1 flex flex-col">
                                        <Label className="text-xs text-slate-400">Final Content (Markdown)</Label>
                                        <Textarea
                                            value={editableData.content}
                                            onChange={(e) => setEditableData({ ...editableData, content: e.target.value })}
                                            className="flex-1 bg-white/5 border-white/10 font-mono text-sm leading-relaxed text-slate-300 resize-none p-6"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>


                    {/* Footer Actions */}
                    <div className="p-4 border-t border-white/5 bg-[#0A0A0B] flex justify-between items-center shrink-0">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-slate-400 hover:text-white"
                        >
                            Discard Changes
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="text-xs text-slate-500 mr-2">
                                {activeTab === "diff" ? "Reviewing diff..." : "Editing final result..."}
                            </div>
                            <Button
                                onClick={handleAccept}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-0 shadow-lg shadow-purple-500/25 transition-all hover:scale-105"
                            >
                                <Check className="mr-2 h-4 w-4" />
                                Accept & Apply
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
