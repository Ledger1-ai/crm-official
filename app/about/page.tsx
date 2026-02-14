// @ts-nocheck
export const dynamic = "force-dynamic";
import React from "react";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import TeamVisualization from "../components/TeamVisualization";
import Image from "next/image";
import TeamMember from "../components/TeamMember";

export const metadata = {
    title: "About Us - BasaltCRM",
    description: "Learn about BasaltCRM, the AI-first CRM designed to automate sales and support for modern businesses.",
};

export default function AboutPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

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
                                            BasaltCRM started in 2025 with a simple observation: CRM software had become bloated, expensive, and surprisingly dumb.
                                            Sales teams were spending more time entering data than closing deals.
                                        </p>
                                        <p>
                                            We set out to build a different kind of CRM. One that works for you, not the other way around.
                                            By integrating state-of-the-art Large Language Models directly into the core of the platform,
                                            we created a system that can predict, automate, and even act on your behalf.
                                        </p>
                                        <p>
                                            Today, thousands of companies use BasaltCRM to punch above their weight class and compete with industry giants.
                                        </p>
                                    </div>
                                </div>
                                <div className="relative h-[400px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                    <TeamVisualization />
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

                            {/* Row 1: 4 columns */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-8">
                                <TeamMember
                                    name="Krishna Patel"
                                    role="Chairman & CTO (Founder)"
                                    imageSrc="/images/team/member1.png"
                                    linkedin="https://www.linkedin.com/in/krishna-patel-89039120/"
                                    twitter="https://x.com/GenRevoeth"
                                />
                                <TeamMember
                                    name="Eric Turner"
                                    role="Chief Executive Officer (CEO)"
                                    imageSrc="/images/team/member6.png"
                                    linkedin="https://www.linkedin.com/in/ericturner85/"
                                    twitter="https://x.com/sinisterxtwitr"
                                />
                                <TeamMember
                                    name="Michael Milton"
                                    role="Chief Marketing Officer (CMO)"
                                    imageSrc="/images/team/member3.png"
                                    linkedin="https://www.linkedin.com/in/mayordelmar/"
                                    twitter="https://x.com/mayordelmar"
                                />
                            </div>

                            {/* Row 2: 2 columns centered */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 max-w-3xl mx-auto">
                                <TeamMember
                                    name="John Garcia"
                                    role="SVP, AI Research"
                                    imageSrc="/images/team/member5.png"
                                    linkedin="https://www.linkedin.com/in/john-garcia-54ab73398/"
                                    twitter="https://x.com/JohnG1isit"
                                />
                                <TeamMember
                                    name="Shahir Monjour"
                                    role="SVP, Engineering"
                                    imageSrc="/images/team/member4.png"
                                    linkedin="https://www.linkedin.com/in/shahir-monjur/"
                                    twitter="https://x.com/shahir1395"
                                />
                            </div>
                        </div>
                    </section>
                </main>

                <BasaltFooter />
            </div>
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
