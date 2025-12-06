"use client";

import { useState, useEffect } from "react";
import { Sparkles, Loader2, FileText, Wand2, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AiAssistantModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: "create" | "revise";
    type: "blog" | "docs" | "career";
    isGenerating: boolean;
    onGenerate?: (topic: string) => void;
    onRevise?: (instruction: string) => void;
}

export function AiAssistantModal({
    isOpen,
    onClose,
    mode,
    type,
    isGenerating,
    onGenerate,
    onRevise
}: AiAssistantModalProps) {
    const [input, setInput] = useState("");

    // Reset input when modal opens/closes
    useEffect(() => {
        if (!isOpen) setInput("");
    }, [isOpen]);

    const handleAction = () => {
        if (!input.trim()) return;
        if (mode === "create" && onGenerate) {
            onGenerate(input);
        } else if (mode === "revise" && onRevise) {
            onRevise(input);
        }
    };

    const getTitle = () => {
        if (mode === "create") return `Create ${type === 'blog' ? 'Blog Post' : type === 'docs' ? 'Documentation' : 'Job Posting'}`;
        return "Revise with AI";
    };

    const getDescription = () => {
        if (mode === "create") return "Transform your ideas into reality. Enter a topic and let AI handle the heavy lifting.";
        return "Refine and polish your content. Give instructions like 'fix grammar', 'make it punchy', or 'expand the introduction'.";
    };

    const getPlaceholder = () => {
        if (mode === "create") return `e.g. ${type === 'blog' ? 'The future of AI in Sales...' : type === 'docs' ? 'How to configure SMTP...' : 'Senior React Developer...'}`;
        return "e.g. Make the tone more professional and fix typos...";
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px] p-0 border-0 bg-transparent shadow-none [&>button]:hidden">
                <div className="bg-[#0A0A0B]/95 border border-white/10 p-8 rounded-3xl w-full shadow-2xl shadow-purple-500/10 relative overflow-hidden backdrop-blur-xl">
                    {/* Background Glow */}
                    <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-blue-500/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-[-50px] left-[-50px] w-40 h-40 bg-purple-500/20 rounded-full blur-[60px] pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Content */}
                    <div className="relative z-10">
                        <DialogTitle className="text-xl font-bold mb-2 flex items-center gap-3 text-white">
                            <div className={cn("p-2 rounded-lg", mode === 'create' ? "bg-blue-500/10" : "bg-purple-500/10")}>
                                {mode === "create" ? (
                                    <Sparkles className={cn("h-5 w-5", mode === 'create' ? "text-blue-400" : "text-purple-400")} />
                                ) : (
                                    <Wand2 className="h-5 w-5 text-purple-400" />
                                )}
                            </div>
                            {getTitle()}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 mb-6 leading-relaxed text-sm">
                            {getDescription()}
                        </DialogDescription>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1.5 block">
                                    {mode === "create" ? "Topic or Concept" : "Instructions"}
                                </label>
                                <textarea
                                    autoFocus
                                    className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-slate-500 focus:ring-0 focus:border-blue-500/50 outline-none transition-all resize-none min-h-[120px] text-base"
                                    placeholder={getPlaceholder()}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" && !e.shiftKey) {
                                            e.preventDefault();
                                            handleAction();
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <Button
                                    variant="ghost"
                                    onClick={onClose}
                                    className="text-slate-400 hover:text-white hover:bg-white/5"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleAction}
                                    disabled={isGenerating || !input.trim()}
                                    className={cn(
                                        "bg-gradient-to-r text-white border-0 shadow-lg shadow-blue-500/25 transition-all hover:opacity-90",
                                        mode === 'create'
                                            ? "from-blue-600 via-indigo-600 to-purple-600"
                                            : "from-purple-600 via-pink-600 to-rose-600"
                                    )}
                                >
                                    {isGenerating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            {mode === "create" ? "Generating..." : "Revising..."}
                                        </>
                                    ) : (
                                        <>
                                            {mode === "create" ? <Sparkles className="mr-2 h-4 w-4" /> : <Wand2 className="mr-2 h-4 w-4" />}
                                            {mode === "create" ? "Generate Content" : "Revise Content"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
