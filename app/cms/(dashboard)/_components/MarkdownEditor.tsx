
"use client";

import { useState } from "react";
import {
    Bold, Italic, List, ListOrdered, Link as LinkIcon,
    Heading1, Heading2, Quote, Code, Eye, Edit2, Image as ImageIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomMarkdownRenderer } from "@/components/ui/custom-markdown-renderer";

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function MarkdownEditor({ value, onChange, className }: MarkdownEditorProps) {
    const [isPreview, setIsPreview] = useState(false);

    const insertText = (before: string, after: string = "") => {
        const textarea = document.getElementById("markdown-editor") as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = value.substring(start, end);
        const newText = value.substring(0, start) + before + selectedText + after + value.substring(end);

        onChange(newText);

        // Restore selection
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + before.length, end + before.length);
        }, 0);
    };

    return (
        <div className={cn("border rounded-md overflow-hidden bg-white dark:bg-slate-950", className)}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b bg-gray-50 dark:bg-slate-900 overflow-x-auto">
                <ToolbarButton onClick={() => setIsPreview(false)} active={!isPreview} icon={<Edit2 className="h-4 w-4" />} title="Edit" />
                <ToolbarButton onClick={() => setIsPreview(true)} active={isPreview} icon={<Eye className="h-4 w-4" />} title="Preview" />
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-2" />

                <ToolbarButton onClick={() => insertText("**", "**")} icon={<Bold className="h-4 w-4" />} title="Bold" disabled={isPreview} />
                <ToolbarButton onClick={() => insertText("*", "*")} icon={<Italic className="h-4 w-4" />} title="Italic" disabled={isPreview} />
                <ToolbarButton onClick={() => insertText("# ")} icon={<Heading1 className="h-4 w-4" />} title="Heading 1" disabled={isPreview} />
                <ToolbarButton onClick={() => insertText("## ")} icon={<Heading2 className="h-4 w-4" />} title="Heading 2" disabled={isPreview} />
                <ToolbarButton onClick={() => insertText("> ")} icon={<Quote className="h-4 w-4" />} title="Quote" disabled={isPreview} />
                <ToolbarButton onClick={() => insertText("```\n", "\n```")} icon={<Code className="h-4 w-4" />} title="Code Block" disabled={isPreview} />
                <ToolbarButton onClick={() => insertText("[", "](url)")} icon={<LinkIcon className="h-4 w-4" />} title="Link" disabled={isPreview} />
                <ToolbarButton onClick={() => insertText("![", "](url)")} icon={<ImageIcon className="h-4 w-4" />} title="Image" disabled={isPreview} />
                <ToolbarButton onClick={() => insertText("- ")} icon={<List className="h-4 w-4" />} title="Bullet List" disabled={isPreview} />
                <ToolbarButton onClick={() => insertText("1. ")} icon={<ListOrdered className="h-4 w-4" />} title="Ordered List" disabled={isPreview} />
            </div>

            {/* Editor / Preview */}
            <div className="min-h-[300px]">
                {isPreview ? (
                    <div className="p-4 prose dark:prose-invert max-w-none bg-[#0A0A0B] rounded-lg">
                        <CustomMarkdownRenderer content={value} />
                    </div>
                ) : (
                    <textarea
                        id="markdown-editor"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="w-full h-full min-h-[300px] p-4 bg-transparent resize-y focus:outline-none font-mono text-sm"
                        placeholder="Write some markdown..."
                    />
                )}
            </div>
        </div>
    );
}

function ToolbarButton({ onClick, icon, title, active, disabled }: any) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={cn(
                "p-2 rounded hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors",
                active && "bg-gray-200 dark:bg-slate-800 text-primary",
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {icon}
        </button>
    );
}


