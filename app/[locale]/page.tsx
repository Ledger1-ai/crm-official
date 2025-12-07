import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    BrainCircuit,
    Bot,
    Sparkles,
    ShieldCheck,
    Globe,
    Zap,
    Calendar,
    ArrowRight,
    TrendingUp,
    Lock,
    MessageSquare,
    BarChart3,
    Users,
    Layers,
    Mail,
} from "lucide-react";
import GeometricBackground from "./components/GeometricBackground";
import AbstractDashboard from "./components/AbstractDashboard";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import MarketingFooter from "./components/MarketingFooter";
import MarketingHeader from "./components/MarketingHeader";

export const metadata: Metadata = {
    title: "Ledger1 – AI Sales & Support Engine",
    description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
    keywords: ["AI CRM", "Sales AI", "Customer Support Bot", "SME CRM", "Next.js CRM"],
    openGraph: {
        title: "Ledger1 – AI Sales & Support Engine",
        description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
        type: "website",
        url: "https://crm.ledger1.ai",
        images: [
            {
                url: "https://crm.ledger1.ai/social-preview.jpg",
                width: 1200,
                height: 630,
                alt: "Ledger1 – AI Sales & Support Engine",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Ledger1 – AI Sales & Support Engine",
        description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
        images: ["https://crm.ledger1.ai/social-preview.jpg"],
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Ledger1CRM",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Community Edition"
    },
    "featureList": ["Predictive Sales AI", "Autonomous Support Agents"],
    "description": "An AI CRM that combines predictive sales analytics with autonomous customer support agents."
};

export default function LandingPage() {
    const demoLink =
        "https://calendar.google.com/appointments/schedules/AcZssZ2Vduqr0QBnEAM50SeixE8a7kXuKt62zEFjQCQ8_xvoO6iF3hluVQHpaM6RYWMGB110_zM3MUF0";

    return (
        <div className="dark min-h-screen bg-background text-foreground font-sans selection:bg-primary/30">
            {/* Header */}
            {/* Header */}
            <MarketingHeader />

            <main className="flex-1 relative">
                {/* Hero Section */}
                <section className="w-full pt-10 pb-20 md:pt-16 md:pb-32 lg:pt-24 lg:pb-48 relative overflow-hidden">
                    <GeometricBackground />
                    <div className="container px-4 md:px-6 relative z-10">
                        <div className="flex flex-col items-center space-y-8 text-center">
                            <div className="space-y-6 max-w-4xl">
                                <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    <span>AI-Assisted software empowering merchants with enterprise grade software</span>
                                </div>
                                <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl lg:text-8xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 drop-shadow-2xl">
                                    Your Business. <br />
                                    <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-teal-500">Supercharged.</span>
                                </h1>
                                <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl lg:text-2xl leading-relaxed">
                                    Focus on the features that keep you competitive in this new era. Be excited about business again. The first CRM that doesn&apos;t just manage your data—it actively works for you. From finding prospects to closing deals with voice AI, Ledger1CRM is your unfair advantage.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6 min-w-[300px] justify-center pt-4">
                                <Link href={demoLink} target="_blank">
                                    <Button size="lg" className="h-14 px-10 text-lg w-full sm:w-auto shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:shadow-[0_0_50px_rgba(6,182,212,0.8)] transition-all duration-300 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                                        Schedule a Demo
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button variant="outline" size="lg" className="h-14 px-10 text-lg w-full sm:w-auto border-white/20 hover:bg-white/10 hover:text-white rounded-full backdrop-blur-sm">
                                        Get Started Free
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AI Advantage Section */}
                <section id="ai-features" className="w-full py-24 md:py-32 relative">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />
                    <div className="container px-4 md:px-6 relative">
                        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                The AI Advantage
                            </h2>
                            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed">
                                Don&apos;t just manage data. Leverage it. Our AI engine transforms your CRM into a growth engine.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <FeatureCard
                                icon={<Zap className="h-12 w-12 text-yellow-400" />}
                                title="AI Lead Generator"
                                description="Stops you from chasing cold leads. Our AI scans the web, curates personalized emails based on deep company research, and fills your pipeline automatically."
                            />
                            <FeatureCard
                                icon={<Mail className="h-12 w-12 text-blue-400" />}
                                title="Smart Email Intelligence"
                                description="Your inbox, supercharged. AI prioritizes urgent threads, drafts context-aware replies, and ensures you never miss a critical message again."
                            />
                            <FeatureCard
                                icon={<Bot className="h-12 w-12 text-cyan-400" />}
                                title="AI Sales Agents"
                                description="Your 24/7 Sales Team. Capable of handling Inbound and Outbound calls, SMS, and Chat. They qualify leads and book appointments while you sleep."
                            />
                            <FeatureCard
                                icon={<Globe className="h-12 w-12 text-pink-400" />}
                                title="Social Intelligence AI"
                                description="Never miss a buying signal. Monitors every social channel to catch trends and competitor moves instantly."
                            />
                            <FeatureCard
                                icon={<MessageSquare className="h-12 w-12 text-violet-400" />}
                                title="Conversation Analytics"
                                description="Understand what sells. Deep sentiment tracking on every call to refine your pitch perfectly."
                            />
                            <FeatureCard
                                icon={<TrendingUp className="h-12 w-12 text-emerald-400" />}
                                title="Pipeline Automation"
                                description="Forecast with certainty. AI predicts revenue and automates follow-ups so no deal slips through the cracks."
                            />
                        </div>
                    </div>
                </section>

                {/* VoiceHub Section */}
                <section id="voicehub" className="w-full py-24 md:py-32 bg-[#020617] relative overflow-hidden text-white border-y border-white/10">
                    {/* Background Effects */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950" />
                    <div className="absolute inset-0 bg-[url('https://voice.ledger1.ai/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

                    <div className="container px-4 md:px-6 relative z-10">
                        {/* Header */}
                        <div className="flex flex-col items-center text-center space-y-8 mb-20 animate-in fade-in slide-in-from-bottom-5 duration-1000 ease-out">
                            <div className="inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-sm font-medium text-cyan-400 backdrop-blur-sm shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                                </span>
                                Live on Mainnet
                            </div>

                            <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-cyan-100 to-cyan-500/50 drop-shadow-2xl">
                                VoiceHub – Real-Time AI<br />
                                Voice Conversations on <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Ethereum</span>
                            </h2>

                            <p className="max-w-[800px] text-lg md:text-xl text-slate-400 font-light leading-relaxed">
                                Professional-grade, ultra-low latency voice AI powered by the world's most advanced real-time models.
                                <span className="block mt-2">Pay per second with ETH. No subscriptions.</span>
                            </p>

                            <div className="flex flex-col sm:flex-row gap-6 pt-4">
                                <Link href="/voicehub">
                                    <Button size="lg" className="h-14 px-10 text-lg rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-[0_0_40px_rgba(6,182,212,0.4)] hover:shadow-[0_0_60px_rgba(6,182,212,0.6)] transition-all duration-300">
                                        Explore VoiceHub
                                        <ArrowRight className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Highlights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                            {[
                                { title: "Enterprise Security", icon: ShieldCheck, desc: "Bank-grade encryption & privacy preservation", color: "text-emerald-400", border: "hover:border-emerald-500/50" },
                                { title: "Next-Gen Voice AI", icon: Sparkles, desc: "Powered by state-of-the-art LLMs & cutting-edge TTS models", color: "text-cyan-400", border: "hover:border-cyan-500/50" },
                                { title: "Pay-Per-Use ETH Billing", icon: Zap, desc: "Stream payments in real-time. Zero commitment.", color: "text-purple-400", border: "hover:border-purple-500/50" }
                            ].map((card, i) => (
                                <div key={i} className={`p-8 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl hover:bg-slate-800/50 transition-all duration-500 group ${card.border}`}>
                                    <card.icon className={`h-10 w-10 mb-4 ${card.color}`} />
                                    <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                                    <p className="text-slate-400 leading-relaxed">{card.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Stats Counter */}
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 py-10 border-y border-white/5 bg-white/[0.02] mb-20">
                            {[
                                { value: "<100ms", label: "Latency" },
                                { value: "1M+", label: "Minutes Processed" },
                                { value: "100+", label: "Languages" },
                                { value: "50K+", label: "Creators" },
                                { value: "99.9%", label: "Uptime" },
                                { value: "10K+", label: "Integrations" },
                            ].map((stat, i) => (
                                <div key={i} className="text-center group">
                                    <div className="text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 mb-1 group-hover:from-cyan-400 group-hover:to-blue-500 transition-all duration-300">
                                        {stat.value}
                                    </div>
                                    <div className="text-xs uppercase tracking-widest text-slate-500 font-semibold">{stat.label}</div>
                                </div>
                            ))}
                        </div>

                        {/* Workflow */}
                        <div className="space-y-12">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold text-white mb-4">How It Works</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
                                <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-slate-700 to-transparent -translate-y-1/2 z-0" />
                                {[
                                    { step: "01", title: "Connect", desc: "Link your Ethereum wallet" },
                                    { step: "02", title: "Configure", desc: "Select voice & personality" },
                                    { step: "03", title: "Engage", desc: "Start real-time conversation" },
                                    { step: "04", title: "Analyze", desc: "Get insights & transcripts" }
                                ].map((item, i) => (
                                    <div key={i} className="relative z-10 flex flex-col items-center text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-xl font-bold text-white mb-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] group hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)] transition-all duration-300">
                                            {item.step}
                                        </div>
                                        <h4 className="text-lg font-semibold text-white mb-1">{item.title}</h4>
                                        <p className="text-sm text-slate-400">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Image Branding */}
                        <div className="mt-20 flex justify-center opacity-80 hover:opacity-100 transition-opacity duration-500">
                            <img
                                src="https://voice.ledger1.ai/vhlogo.png"
                                alt="VoiceHub Logo"
                                loading="lazy"
                                className="h-12 md:h-16 w-auto"
                            />
                        </div>
                    </div>
                </section>

                {/* Enterprise Grade Section */}
                <section id="enterprise" className="w-full py-24 md:py-32 bg-black/40 backdrop-blur-sm border-y border-white/5">
                    <div className="container px-4 md:px-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="space-y-8">
                                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                                    What Ledger1CRM<br />
                                    <span className="text-primary">Does For You.</span>
                                </h2>
                                <p className="text-muted-foreground md:text-xl leading-relaxed">
                                    A self-driving growth engine that operates 24/7. Freedom from repetitive tasks. Confidence in your pipeline. A business that grows even when you&apos;re not watching.
                                </p>
                                <div className="space-y-6">
                                    <div className="flex items-start gap-4 group">
                                        <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                                            <Globe className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl mb-1 group-hover:text-primary transition-colors">Cloud Native & Secure</h3>
                                            <p className="text-muted-foreground">
                                                Enterprise-grade infrastructure that scales with you. Deploy with confidence on our secure cloud.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 group">
                                        <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                                            <Lock className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl mb-1 group-hover:text-primary transition-colors">Bank-Grade Security</h3>
                                            <p className="text-muted-foreground">
                                                End-to-end encryption, role-based access control (RBAC), and SOC2 compliant infrastructure.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 group">
                                        <div className="bg-primary/10 p-3 rounded-xl group-hover:bg-primary/20 transition-colors">
                                            <Zap className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-xl mb-1 group-hover:text-primary transition-colors">Limitless Integrations</h3>
                                            <p className="text-muted-foreground">
                                                Connect seamlessly with your existing stack. AWS, Google Workspace, Slack, and 5000+ apps via Zapier.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative h-[500px] lg:h-[600px] w-full rounded-2xl overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.15)] border border-white/10 bg-black/50 backdrop-blur-xl flex items-center justify-center group">
                                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent opacity-50" />
                                <AbstractDashboard />
                            </div>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="w-full py-24 md:py-32 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5" />
                    <div className="container px-4 md:px-6 relative z-10">
                        <div className="flex flex-col items-center justify-center space-y-8 text-center">
                            <div className="space-y-4 max-w-3xl">
                                <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                                    Ready to Dominate Your Market?
                                </h2>
                                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl">
                                    Join thousands of forward-thinking businesses using Ledger1CRM to scale smarter, faster, and more securely.
                                </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-6">
                                <Link href={demoLink} target="_blank">
                                    <Button size="lg" className="h-14 px-10 text-lg font-semibold shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] bg-primary hover:bg-primary/90 text-primary-foreground rounded-full transition-all">
                                        <Calendar className="mr-2 h-5 w-5" />
                                        Schedule a Demo
                                    </Button>
                                </Link>
                                <Link href="/register">
                                    <Button size="lg" variant="outline" className="h-14 px-10 text-lg border-white/20 hover:bg-white/10 hover:text-white rounded-full backdrop-blur-sm">
                                        Start Free Trial
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <MarketingFooter />
        </div>
    );
}

function FeatureCard({
    icon,
    title,
    description,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <Card className="border border-white/5 shadow-lg hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] transition-all duration-500 bg-white/5 backdrop-blur-md group hover:-translate-y-1">
            <CardHeader>
                <div className="mb-4 p-4 rounded-2xl bg-white/5 w-fit group-hover:bg-primary/10 transition-colors ring-1 ring-white/10 group-hover:ring-primary/30">{icon}</div>
                <CardTitle className="text-2xl group-hover:text-primary transition-colors">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <CardDescription className="text-base leading-relaxed text-muted-foreground/80 group-hover:text-muted-foreground transition-colors">{description}</CardDescription>
            </CardContent>
        </Card>
    );
}
