import React from "react";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";
import { BrainCircuit, Bot, TrendingUp, Zap, ShieldCheck, Globe, BarChart3, Users, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
    title: "Features - Ledger1CRM",
    description: "Explore the AI-powered features of Ledger1CRM.",
};

export default function FeaturesPage() {
    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-sans selection:bg-primary/30">
            <MarketingHeader />

            <main>
                {/* Hero Section */}
                <section className="py-20 md:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                    <div className="container mx-auto px-4 text-center relative z-10">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Features that <span className="text-primary">Empower</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                            Discover how our AI-driven tools can transform your sales and support workflows.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href="/dashboard">
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 text-lg rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Feature Grid */}
                <section className="py-20 bg-black/20">
                    <div className="container mx-auto px-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<BrainCircuit className="h-10 w-10 text-cyan-400" />}
                                title="Predictive Analytics"
                                description="Forecast sales trends and identify high-value leads with our advanced machine learning models. Stop guessing and start closing."
                            />
                            <FeatureCard
                                icon={<Bot className="h-10 w-10 text-teal-400" />}
                                title="Autonomous Agents"
                                description="Deploy AI agents to handle customer inquiries, schedule meetings, and follow up on leads 24/7. Your tireless digital workforce."
                            />
                            <FeatureCard
                                icon={<TrendingUp className="h-10 w-10 text-emerald-400" />}
                                title="Smart Insights"
                                description="Get actionable insights from your data. Ask questions in plain English and get instant answers about your pipeline health."
                            />
                            <FeatureCard
                                icon={<Zap className="h-10 w-10 text-yellow-400" />}
                                title="Workflow Automation"
                                description="Automate repetitive tasks like data entry, email sequences, and task assignment. reclaim hours every week."
                            />
                            <FeatureCard
                                icon={<ShieldCheck className="h-10 w-10 text-purple-400" />}
                                title="Enterprise Security"
                                description="Bank-grade encryption, SOC2 compliance, and role-based access control to keep your data safe and compliant."
                            />
                            <FeatureCard
                                icon={<Globe className="h-10 w-10 text-indigo-400" />}
                                title="Global Scale"
                                description="Built to scale with your business. Support for multiple languages, currencies, and time zones out of the box."
                            />
                        </div>
                    </div>
                </section>

                {/* Deep Dive Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col md:flex-row items-center gap-12 mb-24">
                            <div className="flex-1">
                                <div className="bg-primary/10 p-4 rounded-2xl w-fit mb-6">
                                    <BarChart3 className="h-12 w-12 text-primary" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-6">Data-Driven Decisions</h2>
                                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                                    Our analytics dashboard isn&apos;t just pretty charts. It&apos;s a command center for your business.
                                    Visualize your entire sales funnel, track individual performance, and identify bottlenecks instantly.
                                </p>
                                <ul className="space-y-3 text-gray-300">
                                    <li className="flex items-center"><span className="h-2 w-2 bg-primary rounded-full mr-3" />Real-time revenue tracking</li>
                                    <li className="flex items-center"><span className="h-2 w-2 bg-primary rounded-full mr-3" />Conversion rate optimization</li>
                                    <li className="flex items-center"><span className="h-2 w-2 bg-primary rounded-full mr-3" />Team performance leaderboards</li>
                                </ul>
                            </div>
                            <div className="flex-1 h-[400px] bg-gradient-to-br from-cyan-900/20 to-teal-900/20 rounded-2xl border border-white/10 flex items-center justify-center">
                                <span className="text-white/20 font-bold text-2xl">Dashboard Preview</span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row-reverse items-center gap-12">
                            <div className="flex-1">
                                <div className="bg-purple-500/10 p-4 rounded-2xl w-fit mb-6">
                                    <MessageSquare className="h-12 w-12 text-purple-500" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-6">Unified Communication</h2>
                                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                                    Stop switching tabs. Manage all your customer interactions from a single inbox.
                                    Email, chat, social media, and voice calls—all in one place, powered by AI summaries.
                                </p>
                                <ul className="space-y-3 text-gray-300">
                                    <li className="flex items-center"><span className="h-2 w-2 bg-purple-500 rounded-full mr-3" />Universal Inbox</li>
                                    <li className="flex items-center"><span className="h-2 w-2 bg-purple-500 rounded-full mr-3" />AI-generated response drafts</li>
                                    <li className="flex items-center"><span className="h-2 w-2 bg-purple-500 rounded-full mr-3" />Automatic call transcription</li>
                                </ul>
                            </div>
                            <div className="flex-1 h-[400px] bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-2xl border border-white/10 flex items-center justify-center">
                                <span className="text-white/20 font-bold text-2xl">Inbox Preview</span>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <MarketingFooter />
        </div>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
    return (
        <div className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-colors group">
            <div className="mb-6 p-4 rounded-xl bg-white/5 w-fit group-hover:bg-primary/10 transition-colors">
                {icon}
            </div>
            <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
    );
}
