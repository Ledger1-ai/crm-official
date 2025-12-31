
export const dynamic = "force-dynamic";
import React from "react";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/[locale]/components/GeometricBackground";
import LeadGenDashboard from "../components/LeadGenDashboard";
import AgentInterface from "../components/AgentInterface";
import AnalyticsGraph from "../components/AnalyticsGraph";
import { Zap, Mail, Bot, Globe, MessageSquare, TrendingUp, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
    title: "Features - BasaltCRM",
    description: "Explore the AI-powered features of BasaltCRM.",
};

export default function FeaturesPage() {
    return (
        <div className="min-h-screen font-sans selection:bg-cyan-500/30 text-white">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="flex-grow pt-20">
                    {/* Hero Section */}
                    <section className="py-20 md:py-32 relative overflow-hidden">
                        {/* <div className="absolute inset-0 bg-primary/5 pointer-events-none" /> removed to let geometric bg shine */}
                        <div className="container mx-auto px-4 text-center relative z-10">
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                Features that <span className="text-cyan-400">Empower</span>
                            </h1>
                            <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
                                Discover how our AI-driven tools can transform your sales and support workflows.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Link href="/pricing">
                                    <Button className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-6 text-lg rounded-[10px] shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] font-bold tracking-wider">
                                        Get Started
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Feature Grid */}
                    <section className="py-20 bg-black/20 backdrop-blur-sm">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <FeatureCard
                                    icon={<Zap className="h-10 w-10 text-yellow-400" />}
                                    title="AI Lead Generator"
                                    description="Stop chasing cold leads. Our AI scans the web, curates personalized emails based on deep company research, and fills your pipeline automatically. It's like having a dedicated research team working 24/7."
                                />
                                <FeatureCard
                                    icon={<Mail className="h-10 w-10 text-blue-400" />}
                                    title="Smart Email Intelligence"
                                    description="Your inbox, supercharged. AI prioritizes urgent threads, drafts context-aware replies, and ensures you never miss a critical message again. Reclaim hours of your day."
                                />
                                <FeatureCard
                                    icon={<Bot className="h-10 w-10 text-cyan-400" />}
                                    title="AI Sales Agents"
                                    description="Your 24/7 Sales Team. Capable of handling Inbound and Outbound calls, SMS, and Chat. They qualify leads, book appointments, and nurture prospects while you sleep."
                                />
                                <FeatureCard
                                    icon={<Globe className="h-10 w-10 text-pink-400" />}
                                    title="Social Intelligence AI"
                                    description="Never miss a buying signal. Monitors every social channel to catch trends and competitor moves instantly. Engage with prospects exactly when they're ready to buy."
                                />
                                <FeatureCard
                                    icon={<MessageSquare className="h-10 w-10 text-violet-400" />}
                                    title="Conversation Analytics"
                                    description="Understand what sells. Deep sentiment tracking on every call to refine your pitch perfectly. Turn every conversation into a learning opportunity."
                                />
                                <FeatureCard
                                    icon={<TrendingUp className="h-10 w-10 text-emerald-400" />}
                                    title="Pipeline Automation"
                                    description="Forecast with certainty. AI predicts revenue and automates follow-ups so no deal slips through the cracks. Focus on closing, not data entry."
                                />
                            </div>
                        </div>
                    </section>

                    {/* Deep Dive Section 1: The Growth Engine */}
                    <section className="py-20 md:py-32">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                                <div className="flex-1">
                                    <div className="bg-yellow-400/10 p-4 rounded-2xl w-fit mb-6 border border-yellow-400/20">
                                        <Zap className="h-12 w-12 text-yellow-400" />
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-bold mb-6">The Growth Engine</h2>
                                    <h3 className="text-xl text-cyan-400 font-semibold mb-4">Fill your pipeline while you sleep.</h3>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                        Imagine waking up to a calendar full of qualified meetings. Our <strong>AI Lead Generator</strong> scans the entire web to find your perfect customers, while <strong>Social Intelligence</strong> monitors millions of conversations to catch buying signals the moment they happen.
                                    </p>
                                    <ul className="space-y-4 text-gray-300">
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-yellow-400/20 flex items-center justify-center mr-3 mt-1">
                                                <span className="h-2 w-2 bg-yellow-400 rounded-full" />
                                            </span>
                                            <span><strong>Automated Prospecting:</strong> We find the leads, verify their emails, and enrich their profiles.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-yellow-400/20 flex items-center justify-center mr-3 mt-1">
                                                <span className="h-2 w-2 bg-yellow-400 rounded-full" />
                                            </span>
                                            <span><strong>Competitor Watch:</strong> Get alerted instantly when a prospect complains about your competitor.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-yellow-400/20 flex items-center justify-center mr-3 mt-1">
                                                <span className="h-2 w-2 bg-yellow-400 rounded-full" />
                                            </span>
                                            <span><strong>Hyper-Personalized Outreach:</strong> AI writes emails that look 100% human and get 3x response rates.</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden glass-panel border border-white/10">
                                        <LeadGenDashboard />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Deep Dive Section 2: Digital Workforce */}
                    <section className="py-20 md:py-32 bg-white/5 backdrop-blur-sm">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col md:flex-row-reverse items-center gap-12 md:gap-24">
                                <div className="flex-1">
                                    <div className="bg-cyan-400/10 p-4 rounded-2xl w-fit mb-6 border border-cyan-400/20">
                                        <Bot className="h-12 w-12 text-cyan-400" />
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Your Digital Workforce</h2>
                                    <h3 className="text-xl text-cyan-400 font-semibold mb-4">Scale your team infinitely without hiring.</h3>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                        Your best sales rep never sleeps, never takes a break, and handles thousands of leads instantly. <strong>AI Sales Agents</strong> manage inbound and outbound calls, while <strong>Smart Email Intelligence</strong> ensures your inbox is always at zero.
                                    </p>
                                    <ul className="space-y-4 text-gray-300">
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-cyan-400/20 flex items-center justify-center mr-3 mt-1">
                                                <span className="h-2 w-2 bg-cyan-400 rounded-full" />
                                            </span>
                                            <span><strong>24/7 Availability:</strong> Respond to leads in under 10 seconds, day or night.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-cyan-400/20 flex items-center justify-center mr-3 mt-1">
                                                <span className="h-2 w-2 bg-cyan-400 rounded-full" />
                                            </span>
                                            <span><strong>Context-Aware Drafting:</strong> AI reads your history and drafts perfect replies for you to approve.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-cyan-400/20 flex items-center justify-center mr-3 mt-1">
                                                <span className="h-2 w-2 bg-cyan-400 rounded-full" />
                                            </span>
                                            <span><strong>Multi-Channel Handling:</strong> Seamlessly switch between SMS, Email, and Voice without losing context.</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden glass-panel border border-white/10">
                                        <AgentInterface />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Deep Dive Section 3: Predictive Command Center */}
                    <section className="py-20 md:py-32">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col md:flex-row items-center gap-12 md:gap-24">
                                <div className="flex-1">
                                    <div className="bg-emerald-400/10 p-4 rounded-2xl w-fit mb-6 border border-emerald-400/20">
                                        <TrendingUp className="h-12 w-12 text-emerald-400" />
                                    </div>
                                    <h2 className="text-3xl md:text-5xl font-bold mb-6">Predictive Command Center</h2>
                                    <h3 className="text-xl text-cyan-400 font-semibold mb-4">See the future of your revenue.</h3>
                                    <p className="text-gray-400 text-lg leading-relaxed mb-8">
                                        Stop guessing. Know exactly which deals will close and why. <strong>Conversation Analytics</strong> breaks down every call to tell you what's working, while <strong>Pipeline Automation</strong> predicts revenue with 95% accuracy.
                                    </p>
                                    <ul className="space-y-4 text-gray-300">
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-emerald-400/20 flex items-center justify-center mr-3 mt-1">
                                                <span className="h-2 w-2 bg-emerald-400 rounded-full" />
                                            </span>
                                            <span><strong>Sentiment Analysis:</strong> Know if a prospect is happy, hesitant, or ready to buy based on their tone.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-emerald-400/20 flex items-center justify-center mr-3 mt-1">
                                                <span className="h-2 w-2 bg-emerald-400 rounded-full" />
                                            </span>
                                            <span><strong>Revenue Forecasting:</strong> AI analyzes thousands of data points to predict your month-end numbers.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="h-6 w-6 rounded-full bg-emerald-400/20 flex items-center justify-center mr-3 mt-1">
                                                <span className="h-2 w-2 bg-emerald-400 rounded-full" />
                                            </span>
                                            <span><strong>Auto-Follow Up:</strong> The system automatically nudges stalled deals so nothing slips through the cracks.</span>
                                        </li>
                                    </ul>
                                </div>
                                <div className="flex-1 w-full">
                                    <div className="aspect-square md:aspect-[4/3] rounded-3xl overflow-hidden glass-panel border border-white/10">
                                        <AnalyticsGraph />
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mt-[74px]">
                                <p className="text-xl text-gray-400 mb-6">
                                    Ready to unlock these capabilities?
                                </p>
                                <Link href="/pricing">
                                    <Button className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-6 text-lg rounded-[10px] shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all font-bold tracking-wider">
                                        Compare Plans
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </section>
                </main>

                <BasaltFooter />
            </div>
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
