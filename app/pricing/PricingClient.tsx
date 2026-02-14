"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function PricingClient() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");


    const plans = {
        individual: [
            {
                title: "Testing Plan",
                price: billingCycle === "monthly" ? "$2" : "$18",
                period: billingCycle === "monthly" ? "/ month" : "/ year",
                description: "Perfect for testing the waters.",
                features: [
                    "Basic CRM Features",
                    "Lead Generation: Manual only",
                    "Email Campaigns: 250 / month",
                    "Community Support",
                    "1 User",
                ],
                buttonText: "Get Started Free",
                buttonVariant: "outline" as const,
                popular: false,
            },
            {
                title: "Individual Basic",
                price: billingCycle === "monthly" ? "$50" : "$450",
                period: billingCycle === "monthly" ? "/ month" : "/ year",
                description: "Essential tools for solo professionals.",
                features: [
                    "Lead Generation: 500 / month",
                    "Email Campaigns: 2,500 / month",
                    "Basic AI Lead Enrichment",
                    "Workflow Automation",
                    "Standard Support",
                    "2 Users",
                ],
                buttonText: "Start Basic",
                buttonVariant: "outline" as const,
                popular: false,
            },
            {
                title: "Individual Pro",
                price: billingCycle === "monthly" ? "$150" : "$1,350",
                period: billingCycle === "monthly" ? "/ month" : "/ year",
                description: "Power user features for maximum growth.",
                features: [
                    "Lead Generation: 2,500 / month",
                    "Email Campaigns: 12,500 / month",
                    "Advanced AI Lead Enrichment",
                    "VoiceHub AI Calling (billed per minute)",
                    "SMS Campaigns add-on",
                    "Priority Support & Advanced Reporting",
                    "4 Users",
                ],
                buttonText: "Start Pro",
                buttonVariant: "primary" as const,
                popular: true,
                badge: "MOST POPULAR",
                glowColor: "cyan",
            },
        ],

    };

    return (
        <main className="pt-32 pb-20">
            {/* Hero Section */}
            <section className="text-center px-4 mb-12">
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                    Simple, Transparent <span className="text-primary">Pricing</span>
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-8">
                    Choose the plan that fits your business needs. No hidden fees.
                </p>

                {/* Monthly/Annual Toggle */}
                <div className="flex items-center justify-center space-x-4 mb-16">
                    <span className={`text-sm ${billingCycle === "monthly" ? "text-white" : "text-gray-400"}`}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
                        className="relative w-14 h-8 bg-white/10 rounded-full p-1 transition-colors hover:bg-white/20 focus:outline-none"
                    >
                        <motion.div
                            className="w-6 h-6 bg-primary rounded-full shadow-md"
                            layout
                            transition={{ type: "spring", stiffness: 700, damping: 30 }}
                            animate={{ x: billingCycle === "monthly" ? 0 : 24 }}
                        />
                    </button>
                    <span className={`text-sm ${billingCycle === "annual" ? "text-white" : "text-gray-400"}`}>
                        Annual <span className="text-primary text-xs ml-1">(Save 25%)</span>
                    </span>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="container mx-auto px-4 max-w-7xl mb-24">
                <AnimatePresence mode="wait">
                    <motion.div
                        key="plans"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {plans.individual.map((plan, index) => (
                            <PricingCard key={index} {...plan} />
                        ))}
                    </motion.div>
                </AnimatePresence>
            </section>
            {/* Optional Add-ons */}
            <section className="container mx-auto px-4 max-w-5xl mb-24">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500/10 via-cyan-500/10 to-primary/10 border border-primary/30 p-1">
                    <div className="bg-[#0A0A12] rounded-3xl p-8 md:p-10 backdrop-blur-xl">
                        <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
                            Power Up with Add-ons
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                            <div className="flex items-start space-x-4 bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-primary/50 transition-all group">
                                <div className="bg-gradient-to-br from-primary/30 to-cyan-500/30 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <Check className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold mb-2 text-white group-hover:text-primary transition-colors">VoiceHub AI Calling</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Billed per minute. Scale your outreach with unlimited AI agents available 24/7.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4 bg-white/5 p-6 rounded-2xl border border-white/10 hover:border-primary/50 transition-all group">
                                <div className="bg-gradient-to-br from-primary/30 to-cyan-500/30 p-3 rounded-xl group-hover:scale-110 transition-transform">
                                    <Check className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h4 className="text-lg font-semibold mb-2 text-white group-hover:text-primary transition-colors">SMS Campaigns</h4>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Available as an add-on. Reach your customers directly on their phones with high-converting SMS sequences.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feature Comparison Table */}
            <section className="container mx-auto px-4 max-w-7xl mb-24">
                <h2 className="text-3xl font-bold text-center mb-12">Feature Comparison</h2>
                <AnimatePresence mode="wait">
                    <motion.div
                        key="comparison"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <IndividualComparisonTable />
                    </motion.div>
                </AnimatePresence>
            </section>



            {/* Get in Touch CTA */}
            <section className="container mx-auto px-4 max-w-4xl mb-24">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10 border border-primary/30 p-1">
                    <div className="bg-[#0A0A12] rounded-3xl p-8 md:p-12 backdrop-blur-xl">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl md:text-4xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-pink-400">
                                Have Questions? Let's Talk
                            </h2>
                            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                                Our team is here to help you find the perfect plan for your business. Get in touch and we'll respond within 24 hours.
                            </p>
                        </div>

                        <form
                            onSubmit={async (e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const formData = new FormData(form);

                                try {
                                    const res = await fetch('/api/support/create', {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            name: formData.get('name'),
                                            email: formData.get('email'),
                                            message: formData.get('message'),
                                            company: formData.get('company'),
                                            subject: "Pricing Inquiry",
                                            source: "PRICING"
                                        })
                                    });

                                    if (res.ok) {
                                        alert("Message sent! We'll be in touch.");
                                        form.reset();
                                    }
                                } catch (err) {
                                    alert("Failed to send message.");
                                }
                            }}
                            className="space-y-6 max-w-2xl mx-auto"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                        Work Email *
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        required
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                        placeholder="john@company.com"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="company" className="block text-sm font-medium text-gray-300 mb-2">
                                    Company Name
                                </label>
                                <input
                                    type="text"
                                    id="company"
                                    name="company"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                                    placeholder="Your Company"
                                />
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                                    How can we help? *
                                </label>
                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={4}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all resize-none"
                                    placeholder="Tell us about your needs..."
                                />
                            </div>

                            <div className="text-center pt-4">
                                <Button
                                    type="submit"
                                    className="bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white px-10 py-6 text-lg rounded-[10px] shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_rgba(6,182,212,0.6)] transition-all duration-300 font-semibold"
                                >
                                    Send Message
                                </Button>
                                <p className="text-gray-500 text-sm mt-4">
                                    We'll get back to you within 24 hours
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    )
}

function PricingCard({
    title,
    price,
    period,
    description,
    features,
    buttonText,
    buttonVariant,
    popular,
    badge,
    glowColor,
}: {
    title: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    buttonText: string;
    buttonVariant: "primary" | "outline";
    popular?: boolean;
    badge?: string;
    glowColor?: string;
}) {
    return (
        <div
            className={`relative p-8 rounded-2xl border flex flex-col text-left h-full transition-all duration-300 hover:transform hover:-translate-y-1 ${popular
                ? "border-primary bg-primary/5 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                : "border-white/10 bg-white/5 hover:border-white/20"
                }`}
        >
            {popular && badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide shadow-lg">
                    {badge}
                </div>
            )}
            <div className="mb-8">
                <h3 className="text-2xl font-bold mb-2">{title}</h3>
                <p className="text-gray-400 text-sm h-10">{description}</p>
            </div>

            <div className="flex items-baseline mb-8">
                <span className="text-4xl font-extrabold tracking-tight">{price}</span>
                <span className="text-gray-400 ml-2 text-sm font-medium">{period}</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start text-sm text-gray-300">
                        <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0 mt-0.5" />
                        <span className="leading-tight">{feature}</span>
                    </li>
                ))}
            </ul>

            <Link href="/register" className="w-full mt-auto">
                <Button
                    className={`w-full py-6 text-lg rounded-[10px] font-semibold transition-all duration-300 ${buttonVariant === "primary"
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                        : "bg-transparent border border-white/20 hover:bg-white/10 text-white"
                        }`}
                >
                    {buttonText}
                </Button>
            </Link>
        </div>
    );
}

function IndividualComparisonTable() {
    const features = [
        {
            category: "Lead Generation",
            values: ["Manual only", "500 / month", "2,500 / month"]
        },
        {
            category: "Email Campaigns",
            values: ["250 / month", "2,500 / month", "12,500 / month"]
        },
        {
            category: "AI Lead Enrichment",
            values: ["—", "Basic", "Advanced"]
        },
        {
            category: "VoiceHub AI Calling",
            values: ["—", "—", "✓ (per-minute billing)"]
        },
        {
            category: "SMS Campaigns",
            values: ["—", "—", "Add-on available"]
        },
        {
            category: "Workflow Automation",
            values: ["—", "✓", "✓"]
        },
        {
            category: "Users",
            values: ["1", "2", "4"]
        },
        {
            category: "Support",
            values: ["Community", "Standard", "Priority"]
        },
        {
            category: "Reporting & Analytics",
            values: ["Basic", "Standard", "Advanced"]
        },
    ];

    return (
        <div className="bg-[#0A0A12] border border-white/10 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/10">
                            <th className="text-left p-6 text-gray-400 font-medium">Feature</th>
                            <th className="p-6 text-center font-bold">Testing Plan</th>
                            <th className="p-6 text-center font-bold">Individual Basic</th>
                            <th className="p-6 text-center font-bold bg-primary/5 border-l border-r border-primary/30 relative">
                                <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none"></div>
                                <span className="relative text-primary">Individual Pro</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {features.map((feature, index) => (
                            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                <td className="p-6 text-gray-300 font-medium">{feature.category}</td>
                                <td className="p-6 text-center text-gray-400">{feature.values[0]}</td>
                                <td className="p-6 text-center text-gray-400">{feature.values[1]}</td>
                                <td className="p-6 text-center bg-primary/5 border-l border-r border-primary/20 text-cyan-400 font-medium">
                                    {feature.values[2]}

                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}


