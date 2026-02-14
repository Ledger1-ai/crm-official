"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BlogPostModal } from "@/components/blog/BlogPostModal";

// Reusing colors/styles from original page
const colors = [
    "bg-blue-900/50", "bg-purple-900/50", "bg-green-900/50",
    "bg-orange-900/50", "bg-pink-900/50", "bg-cyan-900/50"
];

interface BlogPost {
    id: string;
    title: string;
    excerpt: string | null;
    content: string;
    category: string | null;
    publishedAt: Date | string;
    coverImage: string | null;
    slug: string;
}

interface BlogGridProps {
    posts: BlogPost[];
}

export function BlogGrid({ posts }: BlogGridProps) {
    const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                {posts.map((post, i) => (
                    <article
                        key={post.id}
                        className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-all h-full flex flex-col cursor-pointer"
                        onClick={() => setSelectedPost(post)}
                    >
                        <div className={`h-48 w-full ${colors[i % colors.length]} relative overflow-hidden`}>
                            {post.coverImage ? (
                                <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-white/20 font-bold text-2xl">
                                    {post.category} Image
                                </div>
                            )}
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                                <span className="bg-white/10 px-2 py-1 rounded-full uppercase tracking-wider font-medium">{post.category || "General"}</span>
                                <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                            </div>
                            <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{post.title}</h2>
                            <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1 line-clamp-3">{post.excerpt || ""}</p>
                            <div className="flex items-center text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                                Read Article <ArrowRight className="ml-2 h-4 w-4" />
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            <BlogPostModal
                post={selectedPost}
                isOpen={!!selectedPost}
                onClose={() => setSelectedPost(null)}
            />
        </>
    );
}
