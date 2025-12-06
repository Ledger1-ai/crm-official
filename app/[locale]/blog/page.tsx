import React from "react";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";

import { ArrowRight } from "lucide-react";
import { prismadb } from "@/lib/prisma";
import { BlogGrid } from "./_components/BlogGrid";

export const metadata = {
    title: "Blog - Ledger1CRM",
    description: "Latest news, updates, and insights from the Ledger1CRM team.",
};

// Helper to get random color for placeholder if no image


export default async function BlogPage() {
    const posts = await prismadb.blogPost.findMany({
        orderBy: { publishedAt: "desc" },
    });

    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-sans selection:bg-primary/30">
            <MarketingHeader />

            <main className="py-20 md:py-32">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-20">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            The Ledger1 <span className="text-primary">Blog</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Insights on AI, sales automation, and the future of work.
                        </p>
                    </div>

                    {posts.length === 0 ? (
                        <div className="text-center text-gray-500 py-20">
                            No posts found. Check back soon!
                        </div>
                    ) : (
                        <BlogGrid posts={posts} />
                    )}
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}



