import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Shield, LineChart, PlugZap, CheckCircle, Wrench, FileText, Zap, Clock, DollarSign, HeartHandshake, Sparkles, Bot, Lock, Globe, Mail, MessageSquare, BarChart3, Database } from "lucide-react";
import competitors from "@/data/competitors.json";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import AgentInterface from "@/app/components/AgentInterface";
import AnalyticsGraph from "@/app/components/AnalyticsGraph";

type Props = {
    params: Promise<{ competitor: string }>;
};

function getBaseUrl(): string {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!envUrl) {
        return "https://crm.basalthq.com";
    }
    // Ensure URL has protocol
    if (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) {
        return `https://${envUrl}`;
    }
    return envUrl;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const competitor = competitors.find((c) => c.slug === params.competitor);
    if (!competitor) return {};

    const title = `BasaltCRM vs ${competitor.name} | The Best Alternative`;
    const description = `Compare BasaltCRM vs ${competitor.name}. See why businesses are switching for better AI features, lower costs, and superior support.`;
    const baseUrl = getBaseUrl();

    let ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(`BasaltCRM vs ${competitor.name}`)}&description=${encodeURIComponent("The Smarter, AI-Native Alternative")}&type=competitor&badge=${encodeURIComponent("Better Alternative")}`;

    return {
        title,
        description,
        keywords: [`${competitor.name} alternative`, "AI CRM", "CRM comparison", competitor.name],
        openGraph: {
            title,
            description,
            type: "website",
            url: `${baseUrl}/compare/${params.competitor}`,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `BasaltCRM vs ${competitor.name}`,
                },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [ogImageUrl],
        },
    };
}

export async function generateStaticParams() {
    return competitors.map((c) => ({
        competitor: c.slug,
    }));
}

const STATIC = {
    parityMatrix: [
        { feature: "Predictive AI for Sales", ours: "Included", theirs: "Often add-on / limited" },
        { feature: "Autonomous Support Agents", ours: "Included", theirs: "Varies by plan" },
        { feature: "Open API & Webhooks", ours: "Open & documented", theirs: "Limited / proprietary" },
        { feature: "Cloud-native SaaS", ours: "Fully managed cloud", theirs: "Varies by vendor" },
        { feature: "Pricing Model", ours: "Flat rate per org", theirs: "Per-seat / usage tiers" },
        { feature: "Data Residency Options", ours: "EU/US options", theirs: "Limited / premium" }
    ],
    faqs: [
        { q: "How long does migration take?", a: "Most teams complete their migration in 1-2 weeks. Our migration specialists handle the heavy lifting—exporting your data, mapping fields, and ensuring nothing gets lost in translation. You'll run both systems in parallel until you're confident everything works perfectly." },
        { q: "Do you offer self-hosting?", a: "BasaltCRM is a cloud-native SaaS platform. This means you get automatic updates, enterprise-grade security, and 99.9% uptime without managing infrastructure. For organizations with specific compliance requirements, we offer dedicated region hosting." },
        { q: "Is there an API?", a: "Absolutely. Our REST API and Webhooks let you connect BasaltCRM to virtually any system in your stack. Every integration uses scoped tokens with configurable rate limits, giving you security without sacrificing flexibility." },
        { q: "How does AI train on our data?", a: "Your data stays yours. Our AI learns from your organization's patterns and signals, but we never mix data across tenants. Each AI agent adapts specifically to your business, improving over time based on your unique workflows and customer interactions." }
    ]
};

export const dynamic = "force-dynamic";

export default async function CompetitorPage(props: Props) {
    const params = await props.params;

    const competitor = competitors.find((c) => c.slug === params.competitor);

    if (!competitor) {
        notFound();
    }

    const primaryCta = { label: "Switch Now", url: "https://calendar.google.com/appointments/schedules/AcZssZ2Vduqr0QBnEAM50SeixE8a7kXuKt62zEFjQCQ8_xvoO6iF3hluVQHpaM6RYWMGB110_zM3MUF0" };

    return (
        <div className="min-h-screen font-sans selection:bg-cyan-500/30 text-white">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />


                {/* Hero */}
                <section className="relative w-full py-20 md:py-32 overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                    <div className="container px-4 md:px-6 relative z-10 text-center">
                        <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm mb-6">
                            <span>Better than {competitor.name}</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6 pb-4">
                            {competitor.comparison_title}
                        </h1>
                        <p className="mx-auto max-w-[800px] text-gray-400 md:text-xl leading-relaxed mb-8">
                            {competitor.comparison_text}
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link href={primaryCta.url} target="_blank">
                                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                                    {primaryCta.label} <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Dashboard Visual - AI Agents & Analytics */}
                <section className="py-10 pb-20">
                    <div className="container px-4 md:px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                            <div className="relative h-[450px] w-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] border border-white/10 bg-black/50 backdrop-blur-xl">
                                <AgentInterface />
                            </div>
                            <div className="relative h-[450px] w-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.15)] border border-white/10 bg-black/50 backdrop-blur-xl">
                                <AnalyticsGraph />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Feature Parity Matrix */}
                <section className="py-20 bg-black/20 border-y border-white/5">
                    <div className="container px-4 md:px-6 max-w-4xl">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">How We Stack Up</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                We&apos;ve done the research so you don&apos;t have to. Here&apos;s an honest look at where BasaltCRM excels compared to {competitor.name}.
                            </p>
                        </div>
                        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#0A0A12]">
                            <div className="grid grid-cols-3 p-6 border-b border-white/10 bg-white/5">
                                <div className="font-bold text-lg text-white">Feature</div>
                                <div className="font-bold text-lg text-center text-primary">BasaltCRM</div>
                                <div className="font-bold text-lg text-center text-gray-400">{competitor.name}</div>
                            </div>
                            {STATIC.parityMatrix.map((row, idx) => (
                                <div key={idx} className={"grid grid-cols-3 p-6 border-b border-white/10 items-center hover:bg-white/5 transition-colors"}>
                                    <div className="text-gray-300">{row.feature}</div>
                                    <div className="text-center flex justify-center items-center gap-2">
                                        <CheckCircle2 className="text-green-500" />
                                        <span className="text-green-400 font-medium">{row.ours}</span>
                                    </div>
                                    <div className="text-center text-gray-500">{row.theirs}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Why Teams Switch */}
                <section className="py-20">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">Why Teams Make the Switch</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Every week, we help teams migrate from {competitor.name}. Here are the three reasons they tell us most often.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {/* AI That Actually Works */}
                            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-8 hover:border-primary/30 transition-all duration-300">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                                    <Bot className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4">AI That Actually Works</h3>
                                <p className="text-gray-400 leading-relaxed mb-6">
                                    Forget &quot;AI-powered&quot; labels slapped on basic automation. BasaltCRM&apos;s agents handle real work—qualifying leads, scheduling meetings, and answering support tickets—without constant babysitting.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-gray-300">Autonomous agents for sales, support, and scheduling</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-gray-300">Learns from your data—no manual training required</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-gray-300">Works 24/7, handles spikes without extra cost</span>
                                    </div>
                                </div>
                            </div>

                            {/* Predictable Pricing */}
                            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-8 hover:border-primary/30 transition-all duration-300">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                                    <DollarSign className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4">Pricing That Makes Sense</h3>
                                <p className="text-gray-400 leading-relaxed mb-6">
                                    Tired of surprise invoices every time you add a user? We charge a flat rate per organization—add as many team members, contacts, and deals as you need without watching the meter.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-gray-300">Unlimited users and contacts included</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-gray-300">AI features included—no premium tier needed</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-gray-300">Transparent costs you can budget for</span>
                                    </div>
                                </div>
                            </div>

                            {/* Modern Architecture */}
                            <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-8 hover:border-primary/30 transition-all duration-300">
                                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                                    <Zap className="w-6 h-6 text-primary" />
                                </div>
                                <h3 className="text-xl font-semibold mb-4">Built for Modern Teams</h3>
                                <p className="text-gray-400 leading-relaxed mb-6">
                                    Legacy CRMs carry decades of technical debt. BasaltCRM was built from scratch with modern APIs, real-time sync, and integrations that just work—no consultants required.
                                </p>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-gray-300">Open API with comprehensive documentation</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-gray-300">Real-time webhooks for instant updates</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <CheckCircle className="w-4 h-4 text-primary shrink-0" />
                                        <span className="text-gray-300">Fast, responsive UI that teams love</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Migration Experience */}
                <section className="py-20 bg-white/5">
                    <div className="container px-4 md:px-6">
                        <div className="max-w-5xl mx-auto">
                            <div className="grid lg:grid-cols-2 gap-12 items-center">
                                <div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Wrench className="w-6 h-6 text-primary" />
                                        <span className="text-primary font-medium">Migration Made Simple</span>
                                    </div>
                                    <h2 className="text-3xl font-bold mb-6">
                                        Switch Without the Stress
                                    </h2>
                                    <p className="text-gray-400 leading-relaxed mb-6">
                                        We know migration is the biggest barrier to switching CRMs. That&apos;s why we&apos;ve invested heavily in making it painless. Our team handles the technical heavy lifting while you keep running your business.
                                    </p>
                                    <p className="text-gray-400 leading-relaxed">
                                        Most teams complete their migration in under two weeks, including data transfer, workflow recreation, and team training. You&apos;ll run both systems in parallel until you&apos;re 100% confident in the switch.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { step: 1, title: "Discovery Call", desc: "We map your current setup—pipelines, automations, and integrations—so nothing gets missed." },
                                        { step: 2, title: "Data Migration", desc: "Export from your current CRM, normalize the data, and import with field-level mapping." },
                                        { step: 3, title: "Workflow Setup", desc: "Recreate your pipelines and automation triggers, often improving them in the process." },
                                        { step: 4, title: "Integration & Training", desc: "Connect your email, calendar, and tools. Train your team on the new system." },
                                        { step: 5, title: "Parallel Run", desc: "Use both systems side-by-side until you're confident everything works." },
                                        { step: 6, title: "Go Live", desc: "Cut over to BasaltCRM and decommission your old system." },
                                    ].map((item) => (
                                        <div key={item.step} className="flex gap-4 p-4 rounded-xl border border-white/10 bg-[#0F0F1A] hover:border-primary/30 transition-colors">
                                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                                                {item.step}
                                            </span>
                                            <div>
                                                <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                                                <p className="text-sm text-gray-400">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Integrations */}
                <section className="py-20">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-12">
                            <div className="flex items-center gap-2 justify-center mb-4">
                                <PlugZap className="w-6 h-6 text-primary" />
                                <span className="text-primary font-medium">Integrations</span>
                            </div>
                            <h2 className="text-3xl font-bold mb-4">Works With Your Stack</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Your CRM should connect to the tools you already use—not force you to change everything.
                                BasaltCRM integrates with the platforms your team relies on every day.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                            {[
                                { title: "Email & Calendar", items: ["Gmail", "Outlook 365", "Google Calendar", "iCal"], icon: <Mail className="h-6 w-6" /> },
                                { title: "Communications", items: ["Twilio Voice", "WhatsApp", "SMS", "Slack"], icon: <MessageSquare className="h-6 w-6" /> },
                                { title: "Documents", items: ["Google Drive", "Dropbox", "DocuSign", "Adobe Sign"], icon: <FileText className="h-6 w-6" /> },
                                { title: "Marketing", items: ["HubSpot Forms", "Meta Lead Ads", "Google Ads"], icon: <BarChart3 className="h-6 w-6" /> },
                                { title: "Data", items: ["Snowflake", "BigQuery", "S3", "CSV"], icon: <Database className="h-6 w-6" /> },
                            ].map((category) => (
                                <div key={category.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-primary/30 transition-colors">
                                    <div className="mb-3 text-primary">{category.icon}</div>
                                    <h3 className="font-semibold mb-4 text-primary">{category.title}</h3>
                                    <ul className="space-y-2">
                                        {category.items.map((item) => (
                                            <li key={item} className="text-sm text-gray-400">{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Security & Compliance */}
                <section className="py-20 bg-white/5">
                    <div className="container px-4 md:px-6">
                        <div className="max-w-5xl mx-auto">
                            <div className="text-center mb-12">
                                <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Security</h2>
                                <p className="text-gray-400 max-w-2xl mx-auto">
                                    Your customer data is your most valuable asset. We protect it with the same rigor as the world&apos;s largest enterprises.
                                </p>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="rounded-2xl border border-white/10 bg-[#0F0F1A] p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Globe className="w-5 h-5 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-semibold">Global Compliance</h3>
                                    </div>
                                    <p className="text-gray-400 mb-6">
                                        Whether you&apos;re serving customers in Europe, North America, or Asia-Pacific, BasaltCRM helps you stay compliant with local data protection regulations.
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {["GDPR", "CCPA", "PIPEDA", "LGPD", "PDPA", "POPIA"].map((cert) => (
                                            <span key={cert} className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-gray-300">
                                                {cert}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-white/10 bg-[#0F0F1A] p-8">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                            <Lock className="w-5 h-5 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-semibold">Security Controls</h3>
                                    </div>
                                    <p className="text-gray-400 mb-6">
                                        From SSO to field-level permissions, we give you granular control over who can access what—without making security a bottleneck.
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex items-center gap-2 text-sm text-gray-300">
                                            <CheckCircle className="w-4 h-4 text-primary" />
                                            SSO with SAML and OIDC support
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-gray-300">
                                            <CheckCircle className="w-4 h-4 text-primary" />
                                            Role-based access control (RBAC)
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-gray-300">
                                            <CheckCircle className="w-4 h-4 text-primary" />
                                            Encryption at rest and in transit
                                        </li>
                                        <li className="flex items-center gap-2 text-sm text-gray-300">
                                            <CheckCircle className="w-4 h-4 text-primary" />
                                            API keys with scoped tokens
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing */}
                <section className="py-20">
                    <div className="container px-4 md:px-6">
                        <div className="max-w-4xl mx-auto text-center">
                            <div className="flex items-center gap-2 justify-center mb-4">
                                <FileText className="w-6 h-6 text-primary" />
                                <span className="text-primary font-medium">Simple Pricing</span>
                            </div>
                            <h2 className="text-3xl font-bold mb-4">One Price. Everything Included.</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto mb-12">
                                No per-seat fees. No surprise charges for AI features. No nickel-and-diming on integrations.
                                You get the full platform for one predictable price.
                            </p>

                            <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/10 to-transparent p-8">
                                <div className="text-4xl font-bold mb-2">Flat Rate Per Organization</div>
                                <p className="text-gray-400 mb-8">Unlimited users • Unlimited contacts • All AI features</p>
                                <div className="grid sm:grid-cols-2 gap-6 text-left max-w-xl mx-auto">
                                    <div>
                                        <h4 className="font-semibold mb-3 text-primary">Included</h4>
                                        <ul className="space-y-2">
                                            <li className="flex items-center gap-2 text-sm text-gray-300">
                                                <CheckCircle className="w-4 h-4 text-primary" />
                                                All CRM modules
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-300">
                                                <CheckCircle className="w-4 h-4 text-primary" />
                                                AI agents (sales, support, scheduling)
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-300">
                                                <CheckCircle className="w-4 h-4 text-primary" />
                                                Dashboards and analytics
                                            </li>
                                            <li className="flex items-center gap-2 text-sm text-gray-300">
                                                <CheckCircle className="w-4 h-4 text-primary" />
                                                Open API access
                                            </li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-3 text-gray-300">Optional Add-ons</h4>
                                        <ul className="space-y-2">
                                            <li className="text-sm text-gray-400">Premium support SLA</li>
                                            <li className="text-sm text-gray-400">Dedicated region hosting</li>
                                            <li className="text-sm text-gray-400">Professional services</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Support */}
                <section className="py-20 bg-white/5">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Support That Has Your Back</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Every customer gets real support from real humans—not chatbots that make you repeat yourself.
                                Choose the level that fits your needs.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                            <div className="rounded-2xl border border-white/10 bg-[#0F0F1A] p-8">
                                <h3 className="text-xl font-semibold mb-2 text-primary">Standard Support</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    Business hours coverage with 24-48 hour response times. Full access to our knowledge base,
                                    video tutorials, and community forums. Perfect for teams who are comfortable self-serving
                                    most questions.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-primary/30 bg-gradient-to-b from-primary/5 to-transparent p-8">
                                <h3 className="text-xl font-semibold mb-2 text-primary">Premium Support</h3>
                                <p className="text-gray-400 leading-relaxed">
                                    24/7 coverage with 1-4 hour response times. Your dedicated Customer Success Manager
                                    conducts quarterly business reviews and proactive optimization sessions. Ideal for
                                    teams where CRM uptime is business-critical.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FAQs */}
                <section className="py-20">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Common Questions</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Switching CRMs is a big decision. Here are the answers to questions we hear most often from teams considering the move.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                            {STATIC.faqs.map((faq, idx) => (
                                <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                                    <h3 className="font-semibold mb-3 text-white">{faq.q}</h3>
                                    <p className="text-gray-400 leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-20 bg-black/20 border-t border-white/5">
                    <div className="container px-4 md:px-6 text-center">
                        <h2 className="text-3xl font-bold mb-6">Ready to Make the Switch?</h2>
                        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                            Join the hundreds of teams who&apos;ve already moved from {competitor.name} to BasaltCRM.
                            We&apos;ll make the migration seamless and have you up and running in days, not months.
                        </p>
                        <div className="flex justify-center">
                            <Link href={primaryCta.url} target="_blank">
                                <Button size="lg" className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]">
                                    {primaryCta.label} <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
                <BasaltFooter />
            </div>
        </div>
    );
}
