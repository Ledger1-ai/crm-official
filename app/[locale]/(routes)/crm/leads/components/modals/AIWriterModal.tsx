"use client";

import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Wand2, X } from "lucide-react";
import { toast } from "react-hot-toast";

interface AIWriterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onInsert: (text: string) => void;
}

export default function AIWriterModal({ isOpen, onClose, onInsert }: AIWriterModalProps) {
    const [prompt, setPrompt] = useState("");
    const [generatedText, setGeneratedText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        if (!prompt.trim()) {
            toast.error("Please enter a prompt");
            return;
        }

        setIsGenerating(true);
        // Simulation for now
        setTimeout(() => {
            setGeneratedText(`[AI Generated based on: "${prompt}"]\n\nHi there,\n\nI noticed your interest in our solutions. I'd love to connect and discuss how we can help optimize your workflow.\n\nBest,\n[Your Name]`);
            setIsGenerating(false);
            toast.success("Text generated!");
        }, 1500);
    };

    const handleInsert = () => {
        if (!generatedText) return;
        onInsert(generatedText);
        onClose();
        // Reset state after closing
        setTimeout(() => {
            setPrompt("");
            setGeneratedText("");
        }, 300);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] border-none shadow-2xl bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl">
                <DialogHeader className="pb-4 border-b">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500">
                            <Wand2 className="w-5 h-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
                                AI Writer
                            </DialogTitle>
                            <DialogDescription className="text-xs font-medium">
                                Describe what you want to say, and let AI draft it for you.
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Instruction</label>
                        <Textarea
                            placeholder="E.g., Write a polite follow-up email to a lead who hasn't clicked my link yet..."
                            className="resize-none border-muted-foreground/20 focus-visible:ring-indigo-500/30 min-h-[80px]"
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                        />
                    </div>

                    {generatedText && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                                <span>Result</span>
                                <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded">Preview</span>
                            </label>
                            <div className="p-3 rounded-md bg-muted/30 border border-muted text-sm whitespace-pre-wrap">
                                {generatedText}
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 border-t pt-4">
                    <Button variant="ghost" size="sm" onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        Cancel
                    </Button>
                    <div className="flex items-center gap-2">
                        {!generatedText ? (
                            <Button
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20"
                            >
                                {isGenerating ? (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2 animate-spin" /> Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" /> Generate
                                    </>
                                )}
                            </Button>
                        ) : (
                            <>
                                <Button variant="outline" size="sm" onClick={handleGenerate} title="Regenerate">
                                    <Wand2 className="w-4 h-4" />
                                </Button>
                                <Button onClick={handleInsert} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                                    Insert Text
                                </Button>
                            </>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
