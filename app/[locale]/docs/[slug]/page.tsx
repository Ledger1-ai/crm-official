import Link from "next/link";
import { ArrowLeft, Video } from "lucide-react";
import { prismadb } from "@/lib/prisma";
import { notFound } from "next/navigation";

// Enhanced Manual Markdown Renderer (since npm install failed)
function MarkdownRenderer({ content }: { content: string }) {
    const lines = content.split('\n');
    let inCodeBlock = false;

    return (
        <div className="prose prose-invert max-w-none">
            {lines.map((line, i) => {
                // Handle Code Blocks
                if (line.trim().startsWith('```')) {
                    inCodeBlock = !inCodeBlock;
                    return null;
                }
                if (inCodeBlock) {
                    return <div key={i} className="bg-gray-900 font-mono text-sm p-1 pl-4 border-l-2 border-primary/50 text-gray-300">{line || '\u00A0'}</div>;
                }

                // Empty lines
                if (line.trim() === '') return <br key={i} />;

                // Headers
                if (line.startsWith('# ')) return <h1 key={i} className="text-4xl font-bold mt-10 mb-6 text-white border-b border-gray-800 pb-2">{line.substring(2)}</h1>;
                if (line.startsWith('## ')) return <h2 key={i} className="text-2xl font-semibold mt-8 mb-4 text-white flex items-center"><span className="w-1 h-6 bg-primary mr-3 rounded-full"></span>{line.substring(3)}</h2>;
                if (line.startsWith('### ')) return <h3 key={i} className="text-xl font-medium mt-6 mb-3 text-white/90">{line.substring(4)}</h3>;

                // Blockquotes
                if (line.startsWith('> ')) return <blockquote key={i} className="border-l-4 border-primary pl-4 py-2 italic my-6 bg-white/5 rounded-r-lg text-gray-300">{line.substring(2)}</blockquote>;

                // Lists
                if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
                    const indent = line.search(/\S/);
                    return <li key={i} className={`list-disc mb-2 text-gray-300 ml-${indent > 0 ? '8' : '5'} pl-1 marker:text-primary`}>{parseInlineStyles(line.trim().substring(2))}</li>;
                }
                if (/^\d+\.\s/.test(line.trim())) {
                    return <li key={i} className="list-decimal ml-5 mb-2 pl-1 text-gray-300 marker:text-primary">{parseInlineStyles(line.trim().replace(/^\d+\.\s/, ''))}</li>;
                }

                // Paragraphs
                return <p key={i} className="mb-4 text-gray-300 leading-relaxed">{parseInlineStyles(line)}</p>;
            })}
        </div>
    );
}

// Helper to parse bold, italic, code, link
function parseInlineStyles(text: string): React.ReactNode {
    // This is a naive parser. For production with rich content, `react-markdown` is highly recommended.
    // Handling standard md: **bold**, *italic*, `code`, [link](url)

    // Split by potential tokens
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);

    return parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={index} className="text-white font-semibold">{part.substring(2, part.length - 2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={index} className="text-white/80">{part.substring(1, part.length - 1)}</em>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={index} className="bg-black/30 px-1.5 py-0.5 rounded text-primary font-mono text-sm border border-white/10">{part.substring(1, part.length - 1)}</code>;
        }
        if (part.startsWith('[') && part.includes('](') && part.endsWith(')')) {
            const match = part.match(/\[(.*?)\]\((.*?)\)/);
            if (match) {
                return <a key={index} href={match[2]} className="text-primary hover:underline hover:text-primary/80 transition-colors">{match[1]}</a>;
            }
        }
        return part;
    });
}

function VideoEmbed({ url }: { url: string }) {
    let embedUrl = "";
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.includes("v=") ? url.split("v=")[1].split("&")[0] : url.split("/").pop();
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
    } else if (url.includes("vimeo.com")) {
        const videoId = url.split("/").pop();
        embedUrl = `https://player.vimeo.com/video/${videoId}`;
    }

    if (!embedUrl) return null;

    return (
        <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10 shadow-2xl mb-8">
            <iframe
                src={embedUrl}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const doc = await prismadb.docArticle.findUnique({
        where: { slug: params.slug },
    });

    if (!doc) return { title: "Article Not Found" };

    return {
        title: `${doc.title} - Documentation`,
        description: `Read about ${doc.title} in the BasaltCRM knowledge base.`,
    };
}

export default async function DocDetailPage(props: { params: Promise<{ slug: string }> }) {
    const params = await props.params;
    const doc = await prismadb.docArticle.findUnique({
        where: { slug: params.slug },
    });

    if (!doc) notFound();

    return (
        <div className="max-w-4xl">
            <Link href="/docs" className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Documentation
            </Link>

            <article>
                <header className="mb-10">
                    <div className="flex items-center gap-2 text-sm text-primary font-medium mb-4 uppercase tracking-wider">
                        <span>{doc.category}</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">{doc.title}</h1>
                </header>

                {doc.videoUrl && (
                    <div className="mb-10">
                        <div className="flex items-center gap-2 text-gray-400 mb-4">
                            <Video className="h-5 w-5 text-primary" />
                            <span className="font-medium">Video Tutorial</span>
                        </div>
                        <VideoEmbed url={doc.videoUrl} />
                    </div>
                )}

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12">
                    <MarkdownRenderer content={doc.content} />
                </div>
            </article>
        </div>
    );
}
