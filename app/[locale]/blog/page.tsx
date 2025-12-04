import React from "react";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const metadata = {
    title: "Blog - Ledger1CRM",
    description: "Latest news, updates, and insights from the Ledger1CRM team.",
};

export default function BlogPage() {
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

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {/* Blog Post 1 */}
                        <BlogPost
                            category="Product"
                            date="Dec 1, 2025"
                            title="Introducing Autonomous Support Agents"
                            excerpt="How our new AI agents can resolve 80% of your support tickets instantly, without human intervention."
                            imageColor="bg-blue-900/50"
                        />

                        {/* Blog Post 2 */}
                        <BlogPost
                            category="Engineering"
                            date="Nov 24, 2025"
                            title="Scaling to 1 Million Requests per Second"
                            excerpt="A deep dive into our infrastructure and how we optimized our PostgreSQL database for massive scale."
                            imageColor="bg-purple-900/50"
                        />

                        {/* Blog Post 3 */}
                        <BlogPost
                            category="Company"
                            date="Nov 10, 2025"
                            title="Ledger1CRM Raises Series A"
                            excerpt="We're excited to announce our $15M Series A funding round led by Sequoia Capital."
                            imageColor="bg-green-900/50"
                        />

                        {/* Blog Post 4 */}
                        <BlogPost
                            category="Tutorial"
                            date="Oct 28, 2025"
                            title="How to Automate Your Sales Pipeline"
                            excerpt="A step-by-step guide to setting up automated email sequences and lead scoring workflows."
                            imageColor="bg-orange-900/50"
                        />

                        {/* Blog Post 5 */}
                        <BlogPost
                            category="AI Research"
                            date="Oct 15, 2025"
                            title="The Future of Predictive Analytics"
                            excerpt="Our research team shares their findings on the next generation of sales prediction models."
                            imageColor="bg-pink-900/50"
                        />

                        {/* Blog Post 6 */}
                        <BlogPost
                            category="Customer Story"
                            date="Oct 1, 2025"
                            title="How Acme Corp Increased Sales by 300%"
                            excerpt="See how a mid-sized manufacturing company used Ledger1CRM to transform their sales process."
                            imageColor="bg-cyan-900/50"
                        />
                    </div>
                </div>
            </main>

            <MarketingFooter />
        </div>
    );
}

function BlogPost({ category, date, title, excerpt, imageColor }: { category: string; date: string; title: string; excerpt: string; imageColor: string }) {
    return (
        <Link href="#" className="group">
            <article className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-primary/30 transition-all h-full flex flex-col">
                <div className={`h-48 w-full ${imageColor} relative`}>
                    {/* Placeholder for blog image */}
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 font-bold text-2xl">
                        {category} Image
                    </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                        <span className="bg-white/10 px-2 py-1 rounded-full uppercase tracking-wider font-medium">{category}</span>
                        <span>{date}</span>
                    </div>
                    <h2 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{title}</h2>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6 flex-1">{excerpt}</p>
                    <div className="flex items-center text-primary font-medium text-sm group-hover:translate-x-1 transition-transform">
                        Read Article <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                </div>
            </article>
        </Link>
    );
}
