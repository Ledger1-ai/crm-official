"use client";

import React from "react";
import Link from "next/link";

interface CustomMarkdownRendererProps {
    content: string;
}

export function CustomMarkdownRenderer({ content }: CustomMarkdownRendererProps) {
    if (!content) return null;

    // Split by double newline to handle paragraphs
    const blocks = content.split(/\n\n+/);

    return (
        <div className="space-y-6">
            {blocks.map((block, i) => {
                const trimmed = block.trim();

                // Headings
                if (trimmed.startsWith('# ')) return <h1 key={i} className="text-3xl font-bold mt-8 mb-4">{parseInline(trimmed.substring(2))}</h1>;
                if (trimmed.startsWith('## ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-3">{parseInline(trimmed.substring(3))}</h2>;
                if (trimmed.startsWith('### ')) return <h3 key={i} className="text-xl font-bold mt-4 mb-2">{parseInline(trimmed.substring(4))}</h3>;

                // Blockquotes
                if (trimmed.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-blue-500 pl-4 italic text-slate-400 my-4">{parseInline(trimmed.substring(2))}</blockquote>;

                // Lists (unordered)
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const items = trimmed.split('\n').map(line => line.replace(/^[-*]\s+/, ''));
                    return (
                        <ul key={i} className="list-disc pl-6 space-y-2 my-4">
                            {items.map((item, j) => <li key={j}>{parseInline(item)}</li>)}
                        </ul>
                    );
                }

                // Lists (ordered)
                if (/^\d+\.\s/.test(trimmed)) {
                    const items = trimmed.split('\n').map(line => line.replace(/^\d+\.\s+/, ''));
                    return (
                        <ol key={i} className="list-decimal pl-6 space-y-2 my-4">
                            {items.map((item, j) => <li key={j}>{parseInline(item)}</li>)}
                        </ol>
                    );
                }

                // Code blocks
                if (trimmed.startsWith('```')) {
                    const code = trimmed.replace(/^```\w*\n?|```$/g, '');
                    return (
                        <pre key={i} className="bg-white/5 p-4 rounded-lg overflow-x-auto my-4 text-sm font-mono text-slate-300 border border-white/10">
                            <code>{code}</code>
                        </pre>
                    );
                }

                return <p key={i} className="leading-relaxed text-slate-300">{parseInline(trimmed)}</p>;
            })}
        </div>
    );
}

function parseInline(text: string): React.ReactNode {
    // Bold
    let parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
        }
        // Links [text](url) - Basic implementation
        const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
        if (linkMatch) {
            const [full, label, url] = linkMatch;
            const split = part.split(full);
            return (
                <span key={i}>
                    {split[0]}
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 border-b border-blue-400/30 hover:border-blue-300 transition-colors">
                        {label}
                    </a>
                    {split[1]}
                </span>
            );
        }

        return part;
    });
}
