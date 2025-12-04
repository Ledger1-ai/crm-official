import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { setRequestLocale } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Globe2, CheckCircle, Shield, LineChart, PlugZap, Bot, Target, Zap, Clock, TrendingUp, Lock, HeartHandshake, Workflow, Building, Users, Mail, MessageSquare, FileText, BarChart3, Database } from "lucide-react";
import GeometricBackground from "@/app/[locale]/components/GeometricBackground";
import locations from "@/data/locations.json";
import MarketingHeader from "@/app/[locale]/components/MarketingHeader";
import MarketingFooter from "@/app/[locale]/components/MarketingFooter";
import AbstractDashboard from "@/app/[locale]/components/AbstractDashboard";

type Props = {
    params: Promise<{ city: string; locale: string }>;
};

function getBaseUrl(): string {
    const envUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!envUrl) {
        return "https://crm.ledger1.ai";
    }
    // Ensure URL has protocol
    if (!envUrl.startsWith("http://") && !envUrl.startsWith("https://")) {
        return `https://${envUrl}`;
    }
    return envUrl;
}

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const location = locations.find((l) => l.slug === params.city);
    if (!location) return {};

    const title = `Top Rated AI CRM in ${location.name} | Ledger1CRM`;
    const description = `Join the fastest growing businesses in ${location.name} using Ledger1CRM. Local support, global compliance, and state-of-the-art AI.`;
    const baseUrl = getBaseUrl();

    let ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(`Ledger1CRM in ${location.name}`)}&description=${encodeURIComponent(`Empowering Businesses in ${location.name}`)}&type=location&badge=${encodeURIComponent("Local Favorite")}`;

    return {
        title,
        description,
        keywords: [`${location.name} CRM`, "AI CRM", `CRM in ${location.name}`, location.name],
        openGraph: {
            title,
            description,
            type: "website",
            url: `${baseUrl}/location/${params.city}`,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `AI CRM in ${location.name}`,
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
    return locations.map((l) => ({
        city: l.slug,
    }));
}

const STATIC = {
    faqs: [
        { q: "Can we self-host?", a: "Ledger1CRM is a cloud-native SaaS platform designed for maximum reliability and automatic updates. For organizations with specific compliance requirements, we offer dedicated region hosting options that provide the security benefits of cloud infrastructure with data residency controls." },
        { q: "Is there an API?", a: "Absolutely. Our REST API and Webhooks let you connect Ledger1CRM to virtually any system in your stack. Every integration uses scoped tokens with configurable rate limits, giving you enterprise-grade security without sacrificing flexibility." },
        { q: "Do you offer local currency and time zone support?", a: "Yes. Ledger1CRM supports multiple currencies, date formats, and time zones out of the box. Your team can work in their local context while the system handles conversions for reporting and collaboration." },
        { q: "How does AI train on our data?", a: "Your data stays yours. Our AI learns from your organization's patterns and signals, but we never mix data across tenants. Each AI agent adapts specifically to your business, improving over time based on your unique workflows and customer interactions." }
    ]
};

export default async function LocationPage(props: Props) {
    const params = await props.params;
    
    // Enable static rendering
    setRequestLocale(params.locale);
    
    const location = locations.find((l) => l.slug === params.city);

    if (!location) {
        notFound();
    }

    const primaryCta = (location?.ctas && location.ctas[0]) || { label: `Get Started in ${location?.name ?? ""}`, url: "https://calendar.google.com/appointments/schedules/AcZssZ2Vduqr0QBnEAM50SeixE8a7kXuKt62zEFjQCQ8_xvoO6iF3hluVQHpaM6RYWMGB110_zM3MUF0" };

    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-sans selection:bg-primary/30">
            <MarketingHeader />

            {/* Hero */}
            <section className="relative w-full py-20 md:py-32 overflow-hidden">
                <GeometricBackground />
                <div className="container px-4 md:px-6 relative z-10 text-center">
                    <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm mb-6">
                        <MapPin className="w-4 h-4 mr-2" />
                        <span>Serving {location.name}</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 drop-shadow-2xl mb-6">
                        {location.hero_title}
                    </h1>
                    <p className="mx-auto max-w-[800px] text-gray-400 md:text-xl leading-relaxed mb-8">
                        {location.description}
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

            {/* Dashboard Visual */}
            <section className="py-10 pb-20">
                <div className="container px-4 md:px-6">
                    <div className="relative h-[500px] w-full max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] border border-white/10 bg-black/50 backdrop-blur-xl flex items-center justify-center group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                        <AbstractDashboard />
                    </div>
                </div>
            </section>

            {/* Why Local Businesses Choose Us */}
            <section className="py-24 bg-black/40 backdrop-blur-sm">
                <div className="container px-4 md:px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Globe2 className="w-6 h-6 text-primary" />
                                    <span className="text-primary font-medium">Local Expertise</span>
                                </div>
                                <h2 className="text-3xl font-bold mb-6">
                                    Why {location.name} Businesses Choose Us
                                </h2>
                                <p className="text-gray-400 text-lg leading-relaxed mb-6">
                                    &quot;{location.context}&quot;
                                </p>
                                <p className="text-gray-400 leading-relaxed">
                                    We understand the unique challenges of the {location.name} market. Whether it&apos;s local compliance
                                    requirements, currency support, or time-zone optimized AI agents, Ledger1CRM is built to help
                                    you dominate locally while scaling globally.
                                </p>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                                        <Building className="text-primary w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Local Market Understanding</h3>
                                        <p className="text-gray-400 text-sm">Our team knows the {location.name} business landscape—the opportunities, the challenges, and what it takes to succeed here.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                                        <Clock className="text-primary w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Time Zone Optimized</h3>
                                        <p className="text-gray-400 text-sm">AI agents work during your business hours, and support is available when you need it—not on someone else&apos;s schedule.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                                        <Shield className="text-primary w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold mb-1">Regional Compliance</h3>
                                        <p className="text-gray-400 text-sm">Data residency options and compliance tooling ensure you meet local regulations without extra work.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* AI Agents Section */}
            <section className="py-20">
                <div className="container px-4 md:px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-4">AI That Works While You Sleep</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Your AI agents don&apos;t take breaks, don&apos;t need coffee, and never forget to follow up.
                            They handle the repetitive work so your {location.name} team can focus on building relationships.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                                <Target className="w-6 h-6 text-blue-400" />
                            </div>
                            <h3 className="font-semibold mb-2">Inbound Triage</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Instantly qualifies new inquiries, routes hot leads to the right rep, and schedules follow-ups—all without human intervention.
                            </p>
                        </div>

                        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-4">
                                <TrendingUp className="w-6 h-6 text-green-400" />
                            </div>
                            <h3 className="font-semibold mb-2">Outbound Nurture</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Keeps leads engaged with personalized outreach, adapting messaging based on engagement signals and moving prospects through your pipeline.
                            </p>
                        </div>

                        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center mb-4">
                                <HeartHandshake className="w-6 h-6 text-amber-400" />
                            </div>
                            <h3 className="font-semibold mb-2">Retention Agent</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Monitors account health and proactively reaches out to at-risk customers before they churn. Surfaces expansion opportunities automatically.
                            </p>
                        </div>

                        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                                <Clock className="w-6 h-6 text-purple-400" />
                            </div>
                            <h3 className="font-semibold mb-2">Scheduling Agent</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                Handles meeting scheduling so your team never has to. Syncs with calendars, respects availability, and sends reminders that reduce no-shows.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Analytics & Insights */}
            <section className="py-20 bg-black/20 border-y border-white/5">
                <div className="container px-4 md:px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <div className="flex items-center gap-2 justify-center mb-4">
                                <LineChart className="w-6 h-6 text-primary" />
                                <span className="text-primary font-medium">Analytics & Insights</span>
                            </div>
                            <h2 className="text-3xl font-bold mb-4">See the Full Picture of Your Business</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Dashboards that tell you something useful—not vanity metrics, but actionable insights
                                that help you make better decisions for your {location.name} operations.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium mb-1">Pipeline Health at a Glance</h4>
                                        <p className="text-sm text-gray-400">See conversion rates, deal velocity, and bottlenecks across every stage of your sales process.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium mb-1">AI-Powered Forecasting</h4>
                                        <p className="text-sm text-gray-400">Predict revenue with confidence using models trained on your historical data and market patterns.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium mb-1">Attribution That Works</h4>
                                        <p className="text-sm text-gray-400">Finally understand which channels and campaigns actually drive revenue—not just clicks and impressions.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="font-medium mb-1">Churn Risk Indicators</h4>
                                        <p className="text-sm text-gray-400">Identify at-risk accounts before it&apos;s too late with engagement-based health scoring.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Workflow Automation */}
            <section className="py-20">
                <div className="container px-4 md:px-6">
                    <div className="text-center mb-12">
                        <div className="flex items-center gap-2 justify-center mb-4">
                            <Workflow className="w-6 h-6 text-primary" />
                            <span className="text-primary font-medium">Automation</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Workflows That Run Themselves</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Stop manually moving deals through stages and chasing follow-ups. Ledger1CRM automates the
                            repetitive work so your team can focus on what humans do best—building relationships.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-8">
                            <h3 className="text-xl font-semibold mb-4">Lead-to-Customer Journey</h3>
                            <p className="text-gray-400 mb-6">
                                From first touch to closed deal, every step can be automated while still feeling personal.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { step: "New lead comes in", action: "Auto-qualify → route to right rep → create task" },
                                    { step: "Discovery call completed", action: "Generate opportunity → send follow-up → schedule next" },
                                    { step: "Proposal sent", action: "Track opens → alert on engagement → auto-nudge" },
                                    { step: "Deal won", action: "Create project → trigger onboarding → notify team" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-start">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <div className="font-medium text-sm">{item.step}</div>
                                            <div className="text-xs text-gray-500">{item.action}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-8">
                            <h3 className="text-xl font-semibold mb-4">Customer Success Playbooks</h3>
                            <p className="text-gray-400 mb-6">
                                Keep customers engaged and growing with automated touchpoints and health monitoring.
                            </p>
                            <div className="space-y-4">
                                {[
                                    { step: "Onboarding kickoff", action: "Welcome sequence → training links → success check-in" },
                                    { step: "Usage milestone hit", action: "Celebration email → case study invite → referral ask" },
                                    { step: "Engagement drops", action: "Health alert → proactive outreach → save offer" },
                                    { step: "Renewal approaching", action: "Review summary → upsell opportunity → renewal process" }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex gap-4 items-start">
                                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold shrink-0">
                                            {idx + 1}
                                        </span>
                                        <div>
                                            <div className="font-medium text-sm">{item.step}</div>
                                            <div className="text-xs text-gray-500">{item.action}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Integrations */}
            <section className="py-20 bg-white/5">
                <div className="container px-4 md:px-6">
                    <div className="text-center mb-12">
                        <div className="flex items-center gap-2 justify-center mb-4">
                            <PlugZap className="w-6 h-6 text-primary" />
                            <span className="text-primary font-medium">Integrations</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Works With Your Existing Stack</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Your CRM should be the hub, not a silo. Ledger1CRM integrates seamlessly with the tools
                            your {location.name} team relies on every day.
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
                            <div key={category.title} className="rounded-2xl border border-white/10 bg-[#0F0F1A] p-6 hover:border-primary/30 transition-colors">
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
            <section className="py-20">
                <div className="container px-4 md:px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="text-center mb-12">
                            <h2 className="text-3xl font-bold mb-4">Enterprise-Grade Security</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Your customer data is your most valuable asset. We protect it with the same rigor
                                as the world&apos;s largest enterprises, with compliance built in from day one.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="rounded-2xl border border-white/10 bg-[#0F0F1A] p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                        <Globe2 className="w-5 h-5 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold">Global Compliance</h3>
                                </div>
                                <p className="text-gray-400 mb-6">
                                    Whether you&apos;re serving customers locally in {location.name} or expanding globally,
                                    Ledger1CRM helps you stay compliant with data protection regulations wherever you operate.
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
                                    From SSO to field-level permissions, we give you granular control over who can
                                    access what—without making security a bottleneck.
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

            {/* Onboarding */}
            <section className="py-20 bg-white/5">
                <div className="container px-4 md:px-6">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <Zap className="w-6 h-6 text-primary" />
                                    <span className="text-primary font-medium">Quick Setup</span>
                                </div>
                                <h2 className="text-3xl font-bold mb-6">
                                    Up and Running in Days, Not Months
                                </h2>
                                <p className="text-gray-400 leading-relaxed mb-6">
                                    We&apos;ve streamlined the onboarding process to get your {location.name} team productive fast.
                                    Most teams complete setup in under a week—including data migration, integration setup, and team training.
                                </p>
                                <p className="text-gray-400 leading-relaxed">
                                    Our implementation specialists will help you configure Ledger1CRM to match exactly
                                    how your team works, with support during your local business hours.
                                </p>
                            </div>
                            <div className="space-y-4">
                                {[
                                    { step: 1, title: "Discovery & Planning", desc: "We map your current processes and design the ideal setup." },
                                    { step: 2, title: "Data Migration", desc: "Import your contacts, deals, and history with field-level mapping." },
                                    { step: 3, title: "Configuration", desc: "Set up pipelines, automations, and AI agents for your workflows." },
                                    { step: 4, title: "Integration Setup", desc: "Connect your email, calendar, and other essential tools." },
                                    { step: 5, title: "Team Training", desc: "Get your team comfortable and productive with hands-on sessions." },
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

            {/* Support */}
            <section className="py-20">
                <div className="container px-4 md:px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Support That Has Your Back</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Every customer gets real support from real humans—available during {location.name} business hours.
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
            <section className="py-20 bg-white/5">
                <div className="container px-4 md:px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Common Questions</h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Got questions about using Ledger1CRM in {location.name}? Here are answers to what we hear most often.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {STATIC.faqs.map((faq, idx) => (
                            <div key={idx} className="rounded-2xl border border-white/10 bg-[#0F0F1A] p-6">
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
                    <h2 className="text-3xl font-bold mb-6">Ready to Grow Your {location.name} Business?</h2>
                    <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                        Join the {location.name} businesses who&apos;ve already made the switch to AI-native CRM.
                        See exactly how Ledger1CRM can help you close more deals and keep customers longer.
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
            <MarketingFooter />
        </div>
    );
}
