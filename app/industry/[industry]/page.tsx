import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Users, BarChart3, CheckCircle, Shield, LineChart, PlugZap, Bot, Target, Zap, Clock, TrendingUp, Globe, Lock, HeartHandshake, Workflow, Mail, MessageSquare, FileText, Database } from "lucide-react";
import industries from "@/data/industries.json";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import LeadGenDashboard from "@/app/components/LeadGenDashboard";
import AgentInterface from "@/app/components/AgentInterface";
import AnalyticsGraph from "@/app/components/AnalyticsGraph";

type Props = {
    params: Promise<{ industry: string }>;
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
    const industry = industries.find((i) => i.slug === params.industry);
    if (!industry) return {};

    const title = `Best AI CRM for ${industry.name} | BasaltCRM`;
    const description = `BasaltCRM is the top-rated AI CRM for the ${industry.name} industry. ${industry.use_case}. Start for free.`;
    const baseUrl = getBaseUrl();

    let ogImageUrl = `${baseUrl}/api/og?title=${encodeURIComponent(`AI CRM for ${industry.name}`)}&description=${encodeURIComponent(`The #1 Choice for ${industry.name} Professionals`)}&type=industry&badge=${encodeURIComponent("Industry Leader")}`;

    return {
        title,
        description,
        keywords: [`${industry.name} CRM`, "AI CRM", industry.use_case, industry.name],
        openGraph: {
            title,
            description,
            type: "website",
            url: `${baseUrl}/industry/${params.industry}`,
            images: [
                {
                    url: ogImageUrl,
                    width: 1200,
                    height: 630,
                    alt: `AI CRM for ${industry.name}`,
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
    return industries.map((i) => ({
        industry: i.slug,
    }));
}

const STATIC = {
    faqs: [
        { q: "Can we self-host?", a: "BasaltCRM is a cloud-native SaaS platform designed for maximum reliability and automatic updates. For organizations with specific compliance requirements, we offer dedicated region hosting options that provide the security benefits of cloud infrastructure with data residency controls." },
        { q: "Is there an API?", a: "Absolutely. Our REST API and Webhooks let you connect BasaltCRM to virtually any system in your stack. Every integration uses scoped tokens with configurable rate limits, giving you enterprise-grade security without sacrificing flexibility." },
        { q: "Do you offer templates?", a: "Yes—and they're built specifically for your industry. You'll get pre-configured email templates, pipeline stages, dashboard layouts, and automation workflows that reflect best practices. Of course, everything is fully customizable to match your exact needs." },
        { q: "How does AI train on our data?", a: "Your data stays yours. Our AI learns from your organization's patterns and signals, but we never mix data across tenants. Each AI agent adapts specifically to your business, improving over time based on your unique workflows and customer interactions." }
    ]
};

export const dynamic = "force-dynamic";

export default async function IndustryPage(props: Props) {
    const params = await props.params;

    const industry = industries.find((i) => i.slug === params.industry);

    if (!industry) {
        notFound();
    }

    const primaryCta = { label: `Schedule ${industry.name} Demo`, url: "https://calendar.google.com/appointments/schedules/AcZssZ2Vduqr0QBnEAM50SeixE8a7kXuKt62zEFjQCQ8_xvoO6iF3hluVQHpaM6RYWMGB110_zM3MUF0" };

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
                            <span>CRM for {industry.name}</span>
                        </div>
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6 pb-4">
                            {industry.hero_title}
                        </h1>
                        <p className="mx-auto max-w-[800px] text-gray-400 md:text-xl leading-relaxed mb-8">
                            {industry.description}
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

                {/* Dashboard Preview */}
                <section className="py-20 bg-black/20 border-y border-white/5">
                    <div className="container px-4 md:px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">
                                    Built for How {industry.name} Actually Works
                                </h2>
                                <p className="text-gray-400 text-lg leading-relaxed">
                                    Generic CRMs force you to adapt your workflows to their limitations. BasaltCRM is different—it&apos;s designed from the ground up to handle the unique complexities of {industry.name.toLowerCase()}, from {industry.use_case.toLowerCase()} to managing long-term client relationships.
                                </p>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                                            <Building2 className="text-primary w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">Industry-Specific Data Models</h3>
                                            <p className="text-gray-400 text-sm">Pre-built fields and relationships that match how your industry operates—no custom development required.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                                            <Users className="text-primary w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">Automated Client Engagement</h3>
                                            <p className="text-gray-400 text-sm">AI handles routine follow-ups, freeing your team to focus on high-value relationships.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                                            <BarChart3 className="text-primary w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold mb-1">Predictive Analytics for {industry.name}</h3>
                                            <p className="text-gray-400 text-sm">Forecasting models trained on industry patterns help you spot opportunities before competitors do.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative h-[500px] w-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] border border-white/10 bg-black/50 backdrop-blur-xl">
                                <LeadGenDashboard />
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI-First Approach */}
                <section className="py-20">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold mb-4">AI That Understands {industry.name}</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Our AI agents aren&apos;t generic chatbots with your logo. They&apos;re trained to understand the nuances
                                of {industry.name.toLowerCase()} conversations, terminology, and workflows.
                            </p>
                        </div>

                        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
                            {/* Left: Agent Interface */}
                            <div className="relative h-[500px] w-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] border border-white/10 bg-black/50 backdrop-blur-xl">
                                <AgentInterface />
                            </div>

                            {/* Right: Agent Descriptions */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                            <Target className="w-5 h-5 text-blue-400" />
                                        </div>
                                        <h3 className="font-semibold">Inbound Triage Agent</h3>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Instantly qualifies new inquiries based on your ideal customer profile. Routes hot leads to the right rep,
                                        schedules follow-ups for warm prospects, and politely declines poor fits—all without human intervention.
                                    </p>
                                </div>

                                <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                            <TrendingUp className="w-5 h-5 text-green-400" />
                                        </div>
                                        <h3 className="font-semibold">Outbound Nurture Agent</h3>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Keeps cold and warm leads engaged with personalized outreach. Adapts messaging based on engagement signals
                                        and moves prospects through your pipeline at the right pace—persistent without being pushy.
                                    </p>
                                </div>

                                <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                            <HeartHandshake className="w-5 h-5 text-amber-400" />
                                        </div>
                                        <h3 className="font-semibold">Retention Agent</h3>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Monitors account health signals and proactively reaches out to at-risk customers before they churn.
                                        Surfaces expansion opportunities when engagement patterns indicate readiness to grow.
                                    </p>
                                </div>

                                <div className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-all">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <Clock className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <h3 className="font-semibold">Scheduling Agent</h3>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        Handles the back-and-forth of meeting scheduling so your team never has to. Syncs with your calendar,
                                        respects your availability preferences, and sends reminders that dramatically reduce no-shows.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Analytics Section */}
                <section className="py-20 bg-black/20 border-y border-white/5">
                    <div className="container px-4 md:px-6">
                        <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <LineChart className="w-6 h-6 text-primary" />
                                    <span className="text-primary font-medium">Analytics & Insights</span>
                                </div>
                                <h2 className="text-3xl font-bold mb-6">
                                    Know Where You Stand, See Where You&apos;re Going
                                </h2>
                                <p className="text-gray-400 leading-relaxed mb-6">
                                    Dashboards that actually tell you something useful. Track the metrics that matter for {industry.name.toLowerCase()}—not
                                    vanity numbers, but actionable insights that drive better decisions.
                                </p>

                                <div className="space-y-4">
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
                                    <div className="flex items-start gap-3">
                                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-medium mb-1">Attribution That Works</h4>
                                            <p className="text-sm text-gray-400">Finally understand which channels and campaigns actually drive revenue—not just clicks.</p>
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
                            <div className="relative h-[450px] w-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(16,185,129,0.15)] border border-white/10 bg-black/50 backdrop-blur-xl">
                                <AnalyticsGraph />
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
                                Stop manually moving deals through stages and chasing follow-ups. BasaltCRM automates the
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
                            <h2 className="text-3xl font-bold mb-4">Connects to Everything You Use</h2>
                            <p className="text-gray-400 max-w-2xl mx-auto">
                                Your CRM should be the hub, not a silo. BasaltCRM integrates seamlessly with the tools
                                your {industry.name.toLowerCase()} team relies on every day.
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
                                            <Globe className="w-5 h-5 text-primary" />
                                        </div>
                                        <h3 className="text-xl font-semibold">Global Compliance</h3>
                                    </div>
                                    <p className="text-gray-400 mb-6">
                                        Whether you&apos;re serving customers in Europe, North America, or Asia-Pacific, BasaltCRM
                                        helps you stay compliant with local data protection regulations.
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
                                        We&apos;ve streamlined the onboarding process to get your team productive fast.
                                        Most {industry.name.toLowerCase()} teams complete setup in under a week—including
                                        data migration, integration setup, and team training.
                                    </p>
                                    <p className="text-gray-400 leading-relaxed">
                                        Our implementation specialists have deep experience with {industry.name.toLowerCase()}
                                        workflows and will help you configure BasaltCRM to match exactly how your team works.
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
                                Every customer gets real support from real humans who understand {industry.name.toLowerCase()}.
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
                                Got questions about using BasaltCRM for {industry.name.toLowerCase()}? Here are answers to what we hear most often.
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
                        <h2 className="text-3xl font-bold mb-6">Ready to Transform Your {industry.name} Operations?</h2>
                        <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                            Join the {industry.name.toLowerCase()} teams who&apos;ve already made the switch to AI-native CRM.
                            See exactly how BasaltCRM can help you close more deals and keep customers longer.
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
