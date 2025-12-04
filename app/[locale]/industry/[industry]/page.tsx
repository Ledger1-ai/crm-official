import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Building2, Users, BarChart3, CheckCircle, Shield, LineChart, PlugZap } from "lucide-react";
import industries from "@/data/industries.json";
import MarketingHeader from "@/app/[locale]/components/MarketingHeader";
import MarketingFooter from "@/app/[locale]/components/MarketingFooter";
import AbstractDashboard from "@/app/[locale]/components/AbstractDashboard";

type Props = {
    params: Promise<{ industry: string }>;
};

export async function generateMetadata(props: Props): Promise<Metadata> {
    const params = await props.params;
    const industry = industries.find((i) => i.slug === params.industry);
    if (!industry) return {};

    const title = `Best AI CRM for ${industry.name} | Ledger1CRM`;
    const description = `Ledger1CRM is the top-rated AI CRM for the ${industry.name} industry. ${industry.use_case}. Start for free.`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const ogUrl = new URL(`${baseUrl}/api/og`);
    ogUrl.searchParams.set("title", `AI CRM for ${industry.name}`);
    ogUrl.searchParams.set("description", `The #1 Choice for ${industry.name} Professionals`);
    ogUrl.searchParams.set("type", "industry");
    ogUrl.searchParams.set("badge", "Industry Leader");

    return {
        title,
        description,
        keywords: [`${industry.name} CRM`, "AI CRM", industry.use_case, industry.name],
        openGraph: {
            title,
            description,
            type: "website",
            url: `${process.env.NEXT_PUBLIC_APP_URL}/industry/${params.industry}`,
            images: [
                {
                    url: ogUrl.toString(),
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
            images: [ogUrl.toString()],
        },
    };
}

export async function generateStaticParams() {
    return industries.map((i) => ({
        industry: i.slug,
    }));
}

const STATIC = {
    features: {
        core: [
            "Unified contacts, accounts, deals, tasks, and documents",
            "Omnichannel capture (web forms, email, phone, chat)",
            "Predictive lead scoring and intent detection",
            "Automated follow-up sequences and reminders",
            "Custom pipelines and multi-stage approval flows",
            "Advanced search, filters, saved views, and bulk actions",
            "Role-based access control, teams, and workspaces",
            "Open API and Webhooks for extensibility"
        ],
        analytics: [
            "KPI dashboards for pipeline, conversion, and cycle times",
            "Forecasting by segment, team, and region",
            "Attribution and campaign ROI tracking",
            "Cohort analysis and churn risk insights"
        ],
        ai_agents: [
            "Inbound triage agent for new inquiries",
            "Outbound nurture agent for cold/warm leads",
            "Retention agent for at-risk accounts",
            "Scheduling agent for meetings and demos",
            "Support agent for FAQs and knowledge base"
        ]
    },
    playbooks: [
        "Lead intake → auto-qualification → owner assignment",
        "Account discovery → opportunity creation → multi-stage approvals",
        "Deal movement → signature → close checklist",
        "Post-close nurture → referral program → expansions"
    ],
    integrations: {
        email_calendar: ["Gmail", "Outlook 365", "Google Calendar", "iCal"],
        communications: ["Twilio/Voice", "WhatsApp", "SMS", "Slack"],
        documents: ["Google Drive", "Dropbox", "DocuSign", "Adobe Sign"],
        marketing: ["HubSpot forms", "Meta Lead Ads", "Google Ads"],
        data: ["Snowflake", "BigQuery", "S3", "CSV import/export"]
    },
    compliance: {
        regions: ["GDPR (EU/UK)", "CCPA/CPRA (US)", "PIPEDA (CA)", "LGPD (BR)", "PDPA (SG/MY)", "POPIA (ZA)"],
        capabilities: [
            "Consent tracking and audit trails",
            "Data subject rights tooling (export/delete/rectify)",
            "Encryption at rest and in transit",
            "Configurable retention policies",
            "Access controls and approvals"
        ]
    },
    security: {
        certifications: ["SOC 2 Type II (patterns)", "ISO 27001 aligned practices"],
        controls: [
            "RBAC and SSO/SAML/OIDC",
            "Field-level permissions",
            "API keys with scoped tokens",
            "IP allowlists and session policies"
        ]
    },
    onboarding: [
        "Discovery and requirements mapping",
        "Data import (CSV/API) and field mapping",
        "Workflow and pipeline configuration",
        "Integration setup (email/calendar/voice)",
        "AI agent tuning and go-live"
    ],
    support_sla: {
        standard: "Business hours support, 24–48h response, knowledge base access",
        premium: "24/7 support, 1–4h response, dedicated CSM, quarterly reviews"
    },
    faqs: [
        { q: "Can we self-host?", a: "Yes. Kubernetes/Helm supported. Cloud hosting also available." },
        { q: "Is there an API?", a: "Yes. REST and Webhooks with scoped tokens and rate limits." },
        { q: "Do you offer templates?", a: "Yes. Email, messaging, pipelines, and dashboards templates are included." },
        { q: "How does AI train?", a: "AI uses organization-specific signals; no cross-tenant data mixing." }
    ]
};

function BulletList({ items }: { items: string[] }) {
    return (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
            {items.map((it, idx) => (
                <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-gray-400">{it}</span>
                </li>
            ))}
        </ul>
    );
}

export default async function IndustryPage(props: Props) {
    const params = await props.params;
    const industry = industries.find((i) => i.slug === params.industry);

    if (!industry) {
        notFound();
    }

    const primaryCta = { label: `Schedule ${industry.name} Demo`, url: "https://calendar.google.com/appointments/schedules/AcZssZ2Vduqr0QBnEAM50SeixE8a7kXuKt62zEFjQCQ8_xvoO6iF3hluVQHpaM6RYWMGB110_zM3MUF0" };

    return (
        <div className="min-h-screen bg-[#0F0F1A] text-white font-sans selection:bg-primary/30">
            <MarketingHeader />
            {/* Hero */}
            <section className="relative w-full py-20 md:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
                <div className="container px-4 md:px-6 relative z-10 text-center">
                    <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm mb-6">
                        <span>CRM for {industry.name}</span>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-6">
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
                                Tailored for {industry.name}
                            </h2>
                            <p className="text-gray-400 text-lg">
                                Ledger1CRM isn&apos;t a generic tool. It adapts to the specific workflows of the {industry.name} sector, handling {industry.use_case.toLowerCase()} with ease.
                            </p>
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-2 rounded-lg"><Building2 className="text-primary" /></div>
                                    <div className="text-gray-300">Industry-Specific Data Models</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-2 rounded-lg"><Users className="text-primary" /></div>
                                    <div className="text-gray-300">Automated Client Engagement</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="bg-primary/10 p-2 rounded-lg"><BarChart3 className="text-primary" /></div>
                                    <div className="text-gray-300">Predictive Analytics for {industry.name}</div>
                                </div>
                            </div>
                        </div>
                        <div className="relative h-[500px] w-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] border border-white/10 bg-black/50 backdrop-blur-xl flex items-center justify-center group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                            <AbstractDashboard />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features & Analytics */}
            <section className="py-20">
                <div className="container px-4 md:px-6">
                    <div className="grid lg:grid-cols-3 gap-10">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-2 mb-6">
                                <PlugZap className="w-6 h-6 text-primary" />
                                <h3 className="text-2xl font-semibold">Core Features</h3>
                            </div>
                            <BulletList items={STATIC.features.core} />
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-2 mb-6">
                                <LineChart className="w-6 h-6 text-primary" />
                                <h3 className="text-2xl font-semibold">Analytics</h3>
                            </div>
                            <BulletList items={STATIC.features.analytics} />
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-2 mb-6">
                                <Shield className="w-6 h-6 text-primary" />
                                <h3 className="text-2xl font-semibold">AI Agents</h3>
                            </div>
                            <BulletList items={STATIC.features.ai_agents} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Automation Playbooks */}
            <section className="py-20 bg-white/5">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold mb-8 text-center">Automation Playbooks</h2>
                    <div className="max-w-4xl mx-auto">
                        <BulletList items={STATIC.playbooks} />
                    </div>
                </div>
            </section>

            {/* Integrations */}
            <section className="py-20">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold mb-10 text-center">Integrations</h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-primary/30 transition-colors">
                            <h3 className="font-semibold mb-3 text-primary">Email & Calendar</h3>
                            <BulletList items={STATIC.integrations.email_calendar} />
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-primary/30 transition-colors">
                            <h3 className="font-semibold mb-3 text-primary">Communications</h3>
                            <BulletList items={STATIC.integrations.communications} />
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-primary/30 transition-colors">
                            <h3 className="font-semibold mb-3 text-primary">Documents</h3>
                            <BulletList items={STATIC.integrations.documents} />
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-primary/30 transition-colors">
                            <h3 className="font-semibold mb-3 text-primary">Marketing</h3>
                            <BulletList items={STATIC.integrations.marketing} />
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-primary/30 transition-colors">
                            <h3 className="font-semibold mb-3 text-primary">Data Platforms</h3>
                            <BulletList items={STATIC.integrations.data} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Compliance & Security */}
            <section className="py-20 bg-white/5">
                <div className="container px-4 md:px-6">
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="rounded-2xl border border-white/10 bg-[#0F0F1A] p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <Shield className="w-6 h-6 text-primary" />
                                <h3 className="text-2xl font-semibold">Compliance</h3>
                            </div>
                            <BulletList items={STATIC.compliance.regions} />
                            <div className="mt-6">
                                <h4 className="font-semibold mb-2 text-gray-300">Capabilities</h4>
                                <BulletList items={STATIC.compliance.capabilities} />
                            </div>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-[#0F0F1A] p-8">
                            <div className="flex items-center gap-2 mb-6">
                                <Shield className="w-6 h-6 text-primary" />
                                <h3 className="text-2xl font-semibold">Security</h3>
                            </div>
                            <h4 className="font-semibold mb-2 text-gray-300">Certifications</h4>
                            <BulletList items={STATIC.security.certifications} />
                            <div className="mt-6">
                                <h4 className="font-semibold mb-2 text-gray-300">Controls</h4>
                                <BulletList items={STATIC.security.controls} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Onboarding */}
            <section className="py-20">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold mb-10 text-center">Onboarding Process</h2>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                        {STATIC.onboarding.map((step, idx) => (
                            <li key={idx} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3 hover:border-primary/30 transition-colors">
                                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">{idx + 1}</span>
                                <span className="text-gray-300">{step}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>

            {/* Support & SLA */}
            <section className="py-20 bg-white/5">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold mb-10 text-center">Support & SLA</h2>
                    <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                        <div className="rounded-2xl border border-white/10 bg-[#0F0F1A] p-8">
                            <h3 className="text-xl font-semibold mb-2 text-primary">Standard</h3>
                            <p className="text-gray-400">{STATIC.support_sla.standard}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-[#0F0F1A] p-8">
                            <h3 className="text-xl font-semibold mb-2 text-primary">Premium</h3>
                            <p className="text-gray-400">{STATIC.support_sla.premium}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQs */}
            <section className="py-20">
                <div className="container px-4 md:px-6">
                    <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        {STATIC.faqs.map((faq, idx) => (
                            <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                                <h3 className="font-semibold mb-2 text-white">{faq.q}</h3>
                                <p className="text-gray-400">{faq.a}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-20 bg-black/20 border-t border-white/5">
                <div className="container px-4 md:px-6 text-center">
                    <h2 className="text-3xl font-bold mb-6">Ready to Get Started?</h2>
                    <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
                        Ledger1CRM helps {industry.name} teams grow with AI-native workflows, world-class security, and flexible integrations.
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
