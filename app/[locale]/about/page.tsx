import React from "react";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";
import Image from "next/image";

export const metadata = {
    title: "About Us - Ledger1CRM",
    description: "Learn about Ledger1CRM, the AI-first CRM designed to automate sales and support for modern businesses.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-sans selection:bg-primary/30">
            <MarketingHeader />

            <main>
                {/* Hero Section */}
                <section className="py-20 md:py-32 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
                    <div className="container mx-auto px-4 relative z-10">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Democratizing <span className="text-primary">AI Intelligence</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                            We believe that advanced AI tools shouldn&apos;t be reserved for Fortune 500 companies.
                            Our mission is to empower every business, no matter the size, with the intelligence they need to grow.
                        </p>
                    </div>
                </section>

                {/* Story Section */}
                <section className="py-20 bg-white/5">
                    <div className="container mx-auto px-4 max-w-5xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                            <div>
                                <h2 className="text-3xl font-bold mb-6">Our Story</h2>
                                <div className="space-y-4 text-gray-300 leading-relaxed">
                                    <p>
                                        Ledger1CRM started in 2023 with a simple observation: CRM software had become bloated, expensive, and surprisingly dumb.
                                        Sales teams were spending more time entering data than closing deals.
                                    </p>
                                    <p>
                                        We set out to build a different kind of CRM. One that works for you, not the other way around.
                                        By integrating state-of-the-art Large Language Models directly into the core of the platform,
                                        we created a system that can predict, automate, and even act on your behalf.
                                    </p>
                                    <p>
                                        Today, thousands of companies use Ledger1CRM to punch above their weight class and compete with industry giants.
                                    </p>
                                </div>
                            </div>
                            <div className="relative h-[400px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                {/* Placeholder for office/team image */}
                                <div className="absolute inset-0 bg-gradient-to-br from-cyan-900/50 to-teal-900/50 flex items-center justify-center">
                                    <span className="text-white/20 text-4xl font-bold">Office Image</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Values Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold mb-12 text-center">Our Values</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            <ValueCard
                                title="Open & Transparent"
                                description="We believe in open standards. Trust is earned through transparency."
                            />
                            <ValueCard
                                title="Customer Obsessed"
                                description="We don't just build software; we build solutions for real people with real problems."
                            />
                            <ValueCard
                                title="Relentless Innovation"
                                description="The AI landscape changes daily. We move fast to bring the latest breakthroughs to our users."
                            />
                        </div>
                    </div>
                </section>

                {/* Team Section */}
                <section className="py-20 bg-white/5">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold mb-12 text-center">Meet the Team</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
                            <TeamMember name="Sarah Chen" role="CEO & Co-Founder" />
                            <TeamMember name="David Miller" role="CTO & Co-Founder" />
                            <TeamMember name="Elena Rodriguez" role="Head of Product" />
                            <TeamMember name="Michael Chang" role="Head of Engineering" />
                        </div>
                    </div>
                </section>
            </main>

            <MarketingFooter />
        </div>
    );
}

function ValueCard({ title, description }: { title: string; description: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-primary/30 transition-colors">
            <h3 className="text-xl font-bold mb-4 text-primary">{title}</h3>
            <p className="text-gray-400 leading-relaxed">{description}</p>
        </div>
    );
}

function TeamMember({ name, role }: { name: string; role: string }) {
    return (
        <div className="text-center group">
            <div className="w-32 h-32 mx-auto rounded-full bg-gray-800 mb-4 overflow-hidden border-2 border-white/10 group-hover:border-primary transition-colors relative">
                <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-xs">Photo</div>
            </div>
            <h3 className="text-lg font-bold text-white">{name}</h3>
            <p className="text-primary text-sm">{role}</p>
        </div>
    );
}
