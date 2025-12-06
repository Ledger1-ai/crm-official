"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Calendar, ArrowRight } from "lucide-react"; // Removed Tag as it wasn't used, or add it if needed

import { cn } from "@/lib/utils";

interface BlogPost {
    id: string;

    title: string;
    excerpt: string | null;
    content: string;
    category: string | null;
    publishedAt: string | Date;
    coverImage?: string | null;
    slug: string;
}

interface BlogPostModalProps {
    post: BlogPost | null;
    isOpen: boolean;
    onClose: () => void;
}

export function BlogPostModal({ post, isOpen, onClose }: BlogPostModalProps) {
    if (!post) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-4xl w-full p-0 border-0 bg-transparent shadow-none [&>button]:hidden h-[90vh]">
                <div className="bg-[#0A0A0B] border border-white/10 rounded-3xl w-full h-full shadow-2xl flex flex-col relative overflow-hidden backdrop-blur-xl">

                    {/* Header Image Area */}
                    <div className="relative h-64 shrink-0 overflow-hidden">
                        {post.coverImage ? (
                            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-900/50 to-purple-900/50 flex items-center justify-center">
                                <span className="text-4xl font-bold text-white/10">{post.category}</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] to-transparent" />

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white/70 hover:text-white transition-colors backdrop-blur-md"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content Scroll Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <div className="p-8 md:p-12 max-w-3xl mx-auto">
                            <div className="flex items-center gap-4 mb-6 text-sm text-slate-400">
                                <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider border border-blue-500/20">
                                    {post.category}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {new Date(post.publishedAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                                </span>
                            </div>

                            <DialogTitle className="text-3xl md:text-4xl font-bold text-white mb-8 leading-tight">
                                {post.title}
                            </DialogTitle>
                            <DialogDescription className="sr-only">
                                Read full article: {post.title}
                            </DialogDescription>

                            <div className="prose prose-invert prose-lg max-w-none prose-headings:text-white prose-p:text-slate-300 prose-a:text-blue-400 hover:prose-a:text-blue-300 prose-strong:text-white prose-code:bg-white/10 prose-code:px-1 prose-code:rounded prose-code:before:content-none prose-code:after:content-none">
                                <CustomMarkdownRenderer content={post.content} />
                            </div>
                        </div>
                    </div>

                    {/* Footer / CTA (Optional) */}
                    <div className="p-4 border-t border-white/5 bg-[#0A0A0B]/95 backdrop-blur flex justify-between items-center shrink-0">
                        <div className="text-sm text-slate-500">
                            Reading: {post.title}
                        </div>
                        <Button onClick={onClose} variant="ghost" className="text-slate-400 hover:text-white">
                            Close Article
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function CustomMarkdownRenderer({ content }: { content: string }) {
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
