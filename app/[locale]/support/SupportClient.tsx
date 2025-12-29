"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Mail, MessageCircle, BookOpen, LifeBuoy } from "lucide-react";
import Link from "next/link";

export default function SupportClient() {
    return (
        <main className="py-20 md:py-32">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
                        How can we <span className="text-primary">help?</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Our team is here to support you. Choose the best way to get in touch.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
                    {/* Knowledge Base */}
                    <SupportCard
                        icon={<BookOpen className="h-8 w-8 text-primary" />}
                        title="Documentation"
                        description="Browse our comprehensive guides and tutorials to find answers instantly."
                        actionText="Visit Knowledge Base"
                        href="/docs"
                    />

                    {/* Community */}
                    <SupportCard
                        icon={<MessageCircle className="h-8 w-8 text-purple-500" />}
                        title="Community Discord"
                        description="Join our active community of developers and users. Ask questions and share tips."
                        actionText="Join Discord"
                        href="https://discord.gg/vARPqF84Zt"
                    />

                    {/* Email Support */}
                    <SupportCard
                        icon={<Mail className="h-8 w-8 text-green-500" />}
                        title="Email Support"
                        description="For account-related issues or technical inquiries, send us an email."
                        actionText="Contact Support"
                        href="mailto:support@basalthq.com"
                    />
                </div>

                {/* Contact Form */}
                <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold mb-6 flex items-center">
                        <LifeBuoy className="mr-3 h-6 w-6 text-primary" />
                        Send us a message
                    </h2>
                    <form className="space-y-6" onSubmit={async (e) => {
                        e.preventDefault();
                        const form = e.target as HTMLFormElement;
                        const formData = new FormData(form);

                        try {
                            const res = await fetch('/api/support/create', {
                                method: 'POST',
                                body: JSON.stringify({
                                    name: formData.get('name'),
                                    email: formData.get('email'),
                                    subject: formData.get('subject'),
                                    message: formData.get('message'),
                                    source: "SUPPORT"
                                })
                            });

                            if (res.ok) {
                                alert("Support ticket created!");
                                form.reset();
                            } else {
                                alert("Failed to create ticket.");
                            }
                        } catch (err) {
                            alert("Failed to create ticket.");
                        }
                    }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label htmlFor="name" className="text-sm font-medium text-gray-300">Name</label>
                                <input type="text" name="name" id="name" required className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label htmlFor="email" className="text-sm font-medium text-gray-300">Email</label>
                                <input type="email" name="email" id="email" required className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="subject" className="text-sm font-medium text-gray-300">Subject</label>
                            <input type="text" name="subject" id="subject" className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="How do I..." />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="message" className="text-sm font-medium text-gray-300">Message</label>
                            <textarea name="message" id="message" rows={5} required className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors" placeholder="Describe your issue..." />
                        </div>
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-lg rounded-full-button-frame shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                            Send Message
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}

function SupportCard({ icon, title, description, actionText, href }: { icon: React.ReactNode; title: string; description: string; actionText: string; href: string }) {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:border-primary/30 transition-colors flex flex-col items-center">
            <div className="bg-white/5 p-4 rounded-full mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-3">{title}</h3>
            <p className="text-gray-400 mb-8 flex-1">{description}</p>
            <Link href={href}>
                <Button variant="outline" className="border-white/20 hover:bg-white/10 text-white">
                    {actionText}
                </Button>
            </Link>
        </div>
    );
}
