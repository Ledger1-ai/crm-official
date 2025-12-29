import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
    Mic,
    Server,
    Shield,
    Zap,
    Globe,
    Users,
    Cpu,
    Code,
    Check,
    ArrowRight,
    Play,
    BarChart3,
    Globe2,
    Lock
} from 'lucide-react';
import * as Motion from 'framer-motion/client';
import MarketingHeader from "../[locale]/components/MarketingHeader";
import MarketingFooter from "../[locale]/components/MarketingFooter";

export const metadata: Metadata = {
    title: 'BasaltEcho - Real-Time AI Voice Conversations',
    description: 'Professional-grade, ultra-low latency voice AI powered by the world\'s most advanced real-time models. Pay per second with ETH.',
    openGraph: {
        title: 'BasaltEcho - Real-Time AI Voice Conversations',
        description: 'Professional-grade, ultra-low latency voice AI powered by the world\'s most advanced real-time models. Pay per second with ETH.',
        images: ['https://echo.basalthq.com/BasaltEchoWide.png'],
    },
};

export default async function VoiceHubPage() {
    return (
        <div className="min-h-screen bg-[#020617] text-white selection:bg-cyan-500/30 overflow-x-hidden font-sans">
            {/* Standard Header */}
            <MarketingHeader />

            {/* 2. Massive Hero Section */}
            <section className="relative min-h-screen flex flex-col justify-center pt-20 overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" />
                    <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] mix-blend-screen" />

                    {/* Subtle Particles */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
                </div>

                <div className="container max-w-7xl mx-auto px-6 relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                    <div className="space-y-8">
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-6">
                                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                                Live on Base & Ethereum
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-bold leading-tight tracking-tight">
                                Real-Time <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-indigo-400">
                                    AI Voice
                                </span> Conversations
                            </h1>
                        </Motion.div>

                        <Motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-lg text-slate-400 max-w-xl leading-relaxed"
                        >
                            Professional-grade, ultra-low latency voice AI powered by the world's most advanced real-time models.
                            Pay per second with ETH. No subscriptions, just pure performance.
                        </Motion.p>

                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="flex flex-wrap gap-4"
                        >
                            <Link
                                href="/pricing"
                                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white transition-all duration-200 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg hover:from-cyan-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 focus:ring-offset-[#020617]"
                            >
                                See Pricing
                                <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" />
                            </Link>
                        </Motion.div>

                        {/* Highlight Cards */}
                        <Motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8"
                        >
                            {[
                                { icon: Shield, label: "Enterprise Security" },
                                { icon: Cpu, label: "Next-Gen Voice AI" },
                                { icon: Zap, label: "Pay-Per-Use ETH" },
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col items-center sm:items-start p-4 rounded-xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                    <item.icon className="w-6 h-6 text-cyan-400 mb-2" />
                                    <span className="text-sm font-medium text-slate-200">{item.label}</span>
                                </div>
                            ))}
                        </Motion.div>
                    </div>

                    {/* Hero Visual - Animated Waveform */}
                    <Motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="flex items-center justify-center relative"
                    >
                        <div className="relative w-full max-w-md aspect-square rounded-full border border-white/10 flex items-center justify-center bg-[#020617]/50 backdrop-blur-sm">
                            {/* Center Glow */}
                            <div className="absolute inset-0 bg-cyan-500/20 blur-[60px] rounded-full" />

                            {/* Animated Rings */}
                            {[1, 2, 3].map((i) => (
                                <Motion.div
                                    key={i}
                                    className="absolute border border-cyan-500/30 rounded-full"
                                    style={{ width: `${i * 30 + 40}%`, height: `${i * 30 + 40}%` }}
                                    animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
                                    transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, ease: "easeInOut" }}
                                />
                            ))}

                            {/* Waveform Visualization */}
                            <div className="flex gap-1 items-end h-32">
                                {[...Array(12)].map((_, i) => (
                                    <Motion.div
                                        key={i}
                                        className="w-3 bg-gradient-to-t from-cyan-500 to-purple-500 rounded-full"
                                        animate={{ height: ["20%", "80%", "30%"] }}
                                        transition={{
                                            duration: 0.8,
                                            repeat: Infinity,
                                            repeatType: "mirror",
                                            delay: i * 0.1,
                                            ease: "easeInOut"
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </Motion.div>
                </div>
            </section>

            {/* 3. Animated Stats Section */}
            <section className="py-20 border-y border-white/5 bg-white/[0.02]">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
                    {[
                        { value: "100", suffix: "ms", label: "Latency", prefix: "<" },
                        { value: "1", suffix: "M+", label: "Minutes" },
                        { value: "100", suffix: "+", label: "Languages" },
                        { value: "50", suffix: "K+", label: "Creators" },
                        { value: "99.9", suffix: "%", label: "Uptime" },
                        { value: "10", suffix: "K+", label: "Integrations" },
                    ].map((stat, i) => (
                        <div key={i} className="text-center group">
                            <div className="text-3xl font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">
                                {stat.prefix}{stat.value}{stat.suffix}
                            </div>
                            <div className="text-sm text-slate-500 font-medium uppercase tracking-wide">{stat.label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 4. Features Grid */}
            <section id="features" className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Enterprise Features</h2>
                        <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                            Everything you need to integrate intelligent voice AI into your workflow, built for scale.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Mic,
                                title: "Real-Time Voice AI",
                                desc: "Ultra-low latency voice conversations available via WebRTC streaming."
                            },
                            {
                                icon: Users,
                                title: "Customizable Personas",
                                desc: "Configure AI assistants with custom domains, languages, styles, and expertise."
                            },
                            {
                                icon: Globe,
                                title: "Universal Integration",
                                desc: "Stream to Twitter Spaces, Zoom, Discord, or any platform with seamless routing."
                            },
                            {
                                icon: Zap,
                                title: "ETH Micropayments",
                                desc: "Pay only for what you use with per-second billing. No hidden fees."
                            },
                            {
                                icon: BarChart3,
                                title: "Deep Analytics",
                                desc: "Track engagement, session quality, and usage patterns with comprehensive metrics."
                            },
                            {
                                icon: Lock,
                                title: "Secure Profile System",
                                desc: "Build professional profiles with custom avatars, bios, and activity tracking."
                            },
                        ].map((feature, i) => (
                            <Motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.1 }}
                                className="group p-8 rounded-2xl bg-white/5 border border-white/5 hover:border-cyan-500/50 hover:bg-white/[0.08] transition-all duration-300"
                            >
                                <div className="w-12 h-12 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                    <feature.icon className="w-6 h-6 text-cyan-400" />
                                </div>
                                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-cyan-300 transition-colors">{feature.title}</h3>
                                <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
                            </Motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 5. Workflow Section */}
            <section id="workflow" className="py-24 bg-[#050B1F]">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">How It Works</h2>
                        <p className="text-slate-400">Get started with AI voice conversations in minutes</p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-8 relative">
                        {/* Connecting Line (Desktop) */}
                        <div className="hidden md:block absolute top-12 left-[12%] right-[12%] h-0.5 bg-gradient-to-r from-cyan-500/0 via-cyan-500/30 to-cyan-500/0" />

                        {[
                            { step: "01", title: "Connect", desc: "Sign in with your wallet or social account securely." },
                            { step: "02", title: "Configure", desc: "Choose voice, language, and domain expertise." },
                            { step: "03", title: "Engage", desc: "Start your conversation. Go live anywhere." },
                            { step: "04", title: "Analyze", desc: "Review session summaries and optimize performance." },
                        ].map((item, i) => (
                            <Motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.15 }}
                                className="relative text-center z-10"
                            >
                                <div className="w-24 h-24 mx-auto rounded-full bg-[#020617] border-4 border-cyan-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.15)] text-2xl font-bold text-cyan-400 font-mono">
                                    {item.step}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                <p className="text-slate-400 text-sm">{item.desc}</p>
                            </Motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 6. Use-Case Section */}
            <section className="py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for Professionals</h2>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                title: "Content Creators",
                                icon: Mic,
                                features: ["Twitter Spaces integration", "Custom AI personalities", "Live audience engagement"],
                                gradient: "from-purple-500/10 to-blue-500/10"
                            },
                            {
                                title: "Business Teams",
                                icon: Users,
                                features: ["Customer support agents", "Multi-language support", "Usage analytics & reporting"],
                                gradient: "from-cyan-500/10 to-teal-500/10"
                            },
                            {
                                title: "Developers",
                                icon: Code,
                                features: ["RESTful API access", "WebRTC streaming SDK", "Flexible deployment"],
                                gradient: "from-indigo-500/10 to-violet-500/10"
                            }
                        ].map((useCase, i) => (
                            <div key={i} className={`p-8 rounded-2xl border border-white/5 bg-gradient-to-br ${useCase.gradient} hover:border-cyan-500/30 transition-all`}>
                                <useCase.icon className="w-10 h-10 text-white mb-6 opacity-80" />
                                <h3 className="text-2xl font-bold mb-6">{useCase.title}</h3>
                                <ul className="space-y-3">
                                    {useCase.features.map((f, idx) => (
                                        <li key={idx} className="flex items-center text-slate-300">
                                            <Check className="w-5 h-5 text-cyan-500 mr-3 shrink-0" />
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* 7. Final Hero CTA */}
            <section className="py-32 relative text-center px-6 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-cyan-900/20 to-[#020617] pointer-events-none" />
                <div className="relative z-10 max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
                        Ready to Transform Your <br />
                        <span className="text-cyan-400">Voice Interactions?</span>
                    </h2>
                    <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
                        Join the future of AI-powered voice communication today.
                        No subscriptions, pay as you go.
                    </p>
                    <Link
                        href="/pricing"
                        className="inline-flex items-center px-10 py-5 text-lg font-bold text-white bg-cyan-600 rounded-full hover:bg-cyan-500 transition-all shadow-[0_0_40px_rgba(8,145,178,0.4)] hover:shadow-[0_0_60px_rgba(8,145,178,0.6)] transform hover:-translate-y-1"
                    >
                        View Pricing Plans
                        <ArrowRight className="ml-2 w-6 h-6" />
                    </Link>
                </div>
            </section>

            {/* Standard Footer */}
            <MarketingFooter />
        </div>
    );
}
