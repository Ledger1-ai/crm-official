import React from "react";
import MarketingHeader from "../components/MarketingHeader";
import MarketingFooter from "../components/MarketingFooter";
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const metadata = {
    title: "Pricing - Ledger1CRM",
    description: "Simple, transparent pricing for teams of all sizes.",
};

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-sans selection:bg-primary/30">
            <MarketingHeader />

            <main>
                {/* Hero Section */}
                <section className="py-20 text-center">
                    <div className="container mx-auto px-4">
                        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                            Simple, Transparent <span className="text-primary">Pricing</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-16">
                            Choose the plan that fits your business needs. No hidden fees.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-24">
                            {/* Starter Plan */}
                            <PricingCard
                                title="Starter"
                                price="$0"
                                description="Perfect for individuals and small teams just getting started."
                                features={[
                                    "Up to 3 Users",
                                    "Basic CRM Features",
                                    "500 AI Credits/mo",
                                    "Community Support",
                                ]}
                                buttonText="Get Started Free"
                                buttonVariant="outline"
                            />

                            {/* Pro Plan */}
                            <PricingCard
                                title="Pro"
                                price="$49"
                                period="/mo"
                                description="For growing teams that need advanced AI and automation."
                                features={[
                                    "Up to 10 Users",
                                    "Advanced Analytics",
                                    "5,000 AI Credits/mo",
                                    "Priority Email Support",
                                    "Workflow Automation",
                                ]}
                                buttonText="Start Pro Trial"
                                buttonVariant="primary"
                                popular
                            />

                            {/* Enterprise Plan */}
                            <PricingCard
                                title="Enterprise"
                                price="Custom"
                                description="For large organizations requiring scale, security, and support."
                                features={[
                                    "Unlimited Users",
                                    "Custom AI Models",
                                    "Unlimited AI Credits",
                                    "Dedicated Success Manager",
                                    "SLA & SSO",
                                ]}
                                buttonText="Contact Sales"
                                buttonVariant="outline"
                            />
                        </div>

                        {/* Comparison Table */}
                        <div className="max-w-6xl mx-auto overflow-x-auto">
                            <h2 className="text-3xl font-bold mb-12">Feature Comparison</h2>
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10">
                                        <th className="py-4 px-6 text-lg font-medium text-gray-400">Features</th>
                                        <th className="py-4 px-6 text-lg font-bold text-white text-center">Starter</th>
                                        <th className="py-4 px-6 text-lg font-bold text-primary text-center">Pro</th>
                                        <th className="py-4 px-6 text-lg font-bold text-white text-center">Enterprise</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    <ComparisonRow feature="Users" starter="3" pro="10" enterprise="Unlimited" />
                                    <ComparisonRow feature="AI Credits" starter="500/mo" pro="5,000/mo" enterprise="Unlimited" />
                                    <ComparisonRow feature="Contact Storage" starter="1,000" pro="10,000" enterprise="Unlimited" />
                                    <ComparisonRow feature="Email Integration" starter={true} pro={true} enterprise={true} />
                                    <ComparisonRow feature="Workflow Automation" starter={false} pro={true} enterprise={true} />
                                    <ComparisonRow feature="Custom Reports" starter={false} pro={true} enterprise={true} />
                                    <ComparisonRow feature="API Access" starter={false} pro={true} enterprise={true} />
                                    <ComparisonRow feature="SSO / SAML" starter={false} pro={false} enterprise={true} />
                                    <ComparisonRow feature="Dedicated Support" starter={false} pro="Priority Email" enterprise="24/7 Phone & Email" />
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </main>

            <MarketingFooter />
        </div>
    );
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
}: {
    title: string;
    price: string;
    period?: string;
    description: string;
    features: string[];
    buttonText: string;
    buttonVariant: "primary" | "outline";
    popular?: boolean;
}) {
    return (
        <div className={`relative p-8 rounded-2xl border ${popular ? "border-primary bg-primary/5" : "border-white/10 bg-white/5"} flex flex-col text-left`}>
            {popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    Most Popular
                </div>
            )}
            <h3 className="text-2xl font-bold mb-2">{title}</h3>
            <div className="flex items-baseline mb-4">
                <span className="text-4xl font-extrabold">{price}</span>
                {period && <span className="text-gray-400 ml-1">{period}</span>}
            </div>
            <p className="text-gray-400 mb-8">{description}</p>
            <ul className="space-y-4 mb-8 flex-1">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-300">
                        <Check className="h-5 w-5 text-primary mr-3 flex-shrink-0" />
                        {feature}
                    </li>
                ))}
            </ul>
            <Link href="/dashboard" className="w-full">
                <Button
                    className={`w-full py-6 text-lg rounded-full ${buttonVariant === "primary"
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

function ComparisonRow({ feature, starter, pro, enterprise }: { feature: string; starter: string | boolean; pro: string | boolean; enterprise: string | boolean }) {
    const renderValue = (val: string | boolean) => {
        if (typeof val === "boolean") {
            return val ? <Check className="h-5 w-5 text-green-500 mx-auto" /> : <X className="h-5 w-5 text-gray-600 mx-auto" />;
        }
        return val;
    };

    return (
        <tr className="hover:bg-white/5 transition-colors">
            <td className="py-4 px-6 text-gray-300 font-medium">{feature}</td>
            <td className="py-4 px-6 text-center text-gray-400">{renderValue(starter)}</td>
            <td className="py-4 px-6 text-center text-gray-400 font-medium">{renderValue(pro)}</td>
            <td className="py-4 px-6 text-center text-gray-400 font-medium">{renderValue(enterprise)}</td>
        </tr>
    );
}
