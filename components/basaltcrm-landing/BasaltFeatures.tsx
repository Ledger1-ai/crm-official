import { Zap, Mail, Bot, Globe, MessageSquare, TrendingUp } from "lucide-react";

export default function BasaltFeatures() {
    return (
        <section id="features" className="relative py-24 px-6">
            <div className="max-w-7xl mx-auto space-y-24">

                {/* Core Focus & Economic Model Grid */}
                <div className="grid md:grid-cols-2 gap-12">
                    {/* Core Focus - AI Automation */}
                    <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors" />
                        <h3 className="section-heading mb-4 text-cyan-500">CORE FOCUS</h3>
                        <h2 className="text-2xl font-bold text-white mb-4">Autonomous Growth</h2>
                        <p className="text-gray-400 leading-relaxed">
                            BasaltCRM isn't just a database; it's an active participant in your business. We engineer AI agents that autonomously prospect, qualify, and close deals, revolutionizing how companies scale their sales and support operations.
                        </p>
                    </div>

                    {/* Economic Model - Efficiency */}
                    <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-colors" />
                        <h3 className="section-heading mb-4 text-indigo-400">ECONOMIC MODEL</h3>
                        <h2 className="text-2xl font-bold text-white mb-4">Zero-Touch Efficiency</h2>
                        <p className="text-gray-400 leading-relaxed">
                            The future of work is automated. By offloading repetitive tasks to intelligent agents, teams can focus on high-value strategy. We leverage voice AI and predictive analytics to minimize overhead and maximize revenue per employee.
                        </p>
                    </div>
                </div>

                {/* AI Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: <Zap className="h-8 w-8 text-yellow-400" />,
                            title: "AI Lead Generator",
                            desc: "Stops you from chasing cold leads. Our AI scans the web, curates personalized emails based on deep company research, and fills your pipeline automatically."
                        },
                        {
                            icon: <Mail className="h-8 w-8 text-blue-400" />,
                            title: "Smart Email Intelligence",
                            desc: "Your inbox, supercharged. AI prioritizes urgent threads, drafts context-aware replies, and ensures you never miss a critical message again."
                        },
                        {
                            icon: <Bot className="h-8 w-8 text-cyan-400" />,
                            title: "AI Sales Agents",
                            desc: "Your 24/7 Sales Team. Capable of handling Inbound and Outbound calls, SMS, and Chat. They qualify leads and book appointments while you sleep."
                        },
                        {
                            icon: <Globe className="h-8 w-8 text-pink-400" />,
                            title: "Social Intelligence AI",
                            desc: "Never miss a buying signal. Monitors every social channel to catch trends and competitor moves instantly."
                        },
                        {
                            icon: <MessageSquare className="h-8 w-8 text-violet-400" />,
                            title: "Conversation Analytics",
                            desc: "Understand what sells. Deep sentiment tracking on every call to refine your pitch perfectly."
                        },
                        {
                            icon: <TrendingUp className="h-8 w-8 text-emerald-400" />,
                            title: "Pipeline Automation",
                            desc: "Forecast with certainty. AI predicts revenue and automates follow-ups so no deal slips through the cracks."
                        }
                    ].map((feature, i) => (
                        <div key={i} className="glass-panel p-6 rounded-2xl group hover:-translate-y-1 transition-all duration-300">
                            <div className="mb-4 p-3 rounded-xl bg-white/5 w-fit group-hover:bg-white/10 transition-colors">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{feature.title}</h3>
                            <p className="text-sm text-gray-400 leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Basalt Echo Feature Highlight */}
                <div className="glass-panel rounded-3xl p-8 md:p-12 border border-cyan-500/30 relative overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-transparent" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="max-w-xl">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <span className="animate-pulse w-2 h-2 bg-cyan-500 rounded-full" />
                                <span className="text-xs font-mono text-cyan-500 tracking-widest">LIVE ON MAINNET</span>
                            </div>
                            <h2 className="text-3xl font-bold text-white mb-4">
                                BasaltEcho: Real-Time Voice AI
                            </h2>
                            <p className="text-gray-300 text-lg mb-2">
                                Professional-grade, ultra-low latency voice AI
                            </p>
                            <p className="text-gray-500 mb-8">
                                Powered by the world's most advanced real-time models. Pay per second with ETH. No subscriptions.
                            </p>
                            <a
                                href="https://echo.basalthq.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center px-8 py-3 font-semibold text-white bg-cyan-500 rounded-[10px] hover:bg-cyan-600 shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300"
                            >
                                EXPLORE BASALT ECHO
                            </a>
                        </div>

                        {/* Visual Decoration */}
                        <div className="relative w-full md:w-1/3 aspect-video md:aspect-square bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-center overflow-hidden group shadow-[0_0_40px_rgba(6,182,212,0.1)]">
                            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-slate-950 to-slate-950" />
                            {/* Abstract Visualization Mockup */}
                            <div className="relative z-10 flex flex-col items-center gap-4">
                                <div className="flex gap-1 items-end h-12">
                                    {[30, 45, 20, 60, 40, 70, 35, 50, 25].map((h, i) => (
                                        <div
                                            key={i}
                                            className="w-1.5 bg-cyan-500 rounded-full animate-pulse"
                                            style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                                        />
                                    ))}
                                </div>
                                <p className="text-xs font-mono text-cyan-400 tracking-widest">VOICE ACTIVE</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
