
export const dynamic = "force-dynamic";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import { Bot, Phone, Globe, Zap, MessageSquare, Briefcase, Cpu, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "AI Agents - BasaltCRM",
    description: "Deploy autonomous AI agents that handle sales, support, and research 24/7.",
};

export default function AliensPage() {
    return (
        <div className="min-h-screen font-sans selection:bg-cyan-500/30 text-white">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="flex-grow pt-20">
                    {/* Hero Section */}
                    <section className="pt-24 pb-8 md:pt-32 md:pb-12 relative overflow-hidden">
                        <div className="container mx-auto px-4 text-center">
                            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                                </span>
                                <span className="text-sm font-mono text-cyan-400 tracking-widest">ACTIVE NEURAL NETWORK</span>
                            </div>

                            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">
                                The Workforce That <br />
                                <span className="text-cyan-400">Never Sleeps</span>
                            </h1>

                            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                                Deploy autonomous agents that prospect, qualify, and close deals while you rest.
                                No breaks, no downtime, just pure performance.
                            </p>

                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Link href="/register">
                                    <Button className="bg-cyan-500 hover:bg-cyan-400 text-black px-8 py-8 text-lg rounded-xl shadow-[0_0_40px_rgba(6,182,212,0.3)] hover:shadow-[0_0_60px_rgba(6,182,212,0.5)] font-bold tracking-wider transition-all duration-300 w-full sm:w-auto">
                                        DEPLOY AGENTS
                                    </Button>
                                </Link>
                                <Link href="/features">
                                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-8 text-lg rounded-xl font-bold tracking-wider w-full sm:w-auto backdrop-blur-sm shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                                        VIEW CAPABILITIES
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </section>

                    {/* Agent Roles Grid */}
                    <section className="pt-8 pb-20">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                <AgentCard
                                    icon={<Phone className="h-8 w-8 text-emerald-400" />}
                                    role="Sales Development Rep"
                                    name="SDR-01"
                                    desc="Handles cold calls, qualifies leads, and books meetings directly to your calendar."
                                />
                                <AgentCard
                                    icon={<MessageSquare className="h-8 w-8 text-violet-400" />}
                                    role="Customer Success"
                                    name="CSM-X"
                                    desc="Instantly resolves tickets, guides users, and reduces churn with proactive check-ins."
                                />
                                <AgentCard
                                    icon={<Globe className="h-8 w-8 text-blue-400" />}
                                    role="Lead Researcher"
                                    name="DATA-9"
                                    desc="Scours the web for prospects, verifying emails and enriching profiles in real-time."
                                />
                                <AgentCard
                                    icon={<Briefcase className="h-8 w-8 text-amber-400" />}
                                    role="Closer"
                                    name="AE-PRIME"
                                    desc="Follows up on warm leads, negotiates terms based on playbooks, and sends contracts."
                                />
                            </div>
                        </div>
                    </section>

                    {/* The Sizzle / Automation Flow */}
                    <section className="py-24 bg-black/40 backdrop-blur-md border-y border-white/5">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
                                <div className="lg:w-1/2">
                                    <h2 className="text-3xl md:text-5xl font-bold mb-8">
                                        End-to-End <span className="text-cyan-400">Autonomy</span>
                                    </h2>
                                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                                        BasaltCRM isn't just a tool; it's a self-driving revenue machine. Our Neuro-Symbolic AI architecture allows agents to reason, plan, and execute complex workflows without human intervention.
                                    </p>

                                    <div className="space-y-6">
                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                            <div className="bg-cyan-500/20 p-3 rounded-lg text-cyan-400">
                                                <Cpu className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2">Cognitive Core</h3>
                                                <p className="text-gray-400 text-sm">Agents understand context, nuance, and intent, allowing for human-like negotiation and empathy.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                            <div className="bg-emerald-500/20 p-3 rounded-lg text-emerald-400">
                                                <Zap className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2">Real-Time Execution</h3>
                                                <p className="text-gray-400 text-sm">Zero latency. Agents react instantly to voice, chat, and market signals.</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                                            <div className="bg-violet-500/20 p-3 rounded-lg text-violet-400">
                                                <ShieldCheck className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold text-white mb-2">Guardrails & Safety</h3>
                                                <p className="text-gray-400 text-sm">Enterprise-grade controls ensure agents always stay on brand and compliant.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:w-1/2 relative">
                                    {/* Visual Representation of Agent Cluster */}
                                    <div className="relative aspect-square max-w-lg mx-auto flex items-center justify-center">
                                        <div className="absolute inset-0 bg-cyan-500/10 rounded-full blur-[80px] animate-pulse" />
                                        <div className="relative z-10 grid grid-cols-2 gap-4 w-full">
                                            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col justify-between hover:-translate-y-2 transition-transform duration-500 shadow-2xl shadow-cyan-900/10 aspect-square">
                                                <Bot className="h-10 w-10 text-cyan-400 mb-4" />
                                                <div>
                                                    <div className="text-xs font-mono text-cyan-500 mb-2 tracking-wider">STATUS: BUSY</div>
                                                    <div className="text-xl font-bold text-white">Booking Demos</div>
                                                    <div className="text-xs text-gray-400 mt-2">142 calls active</div>
                                                </div>
                                            </div>
                                            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col justify-between hover:-translate-y-2 transition-transform duration-500 shadow-2xl shadow-pink-900/10 aspect-square">
                                                <Bot className="h-10 w-10 text-pink-400 mb-4" />
                                                <div>
                                                    <div className="text-xs font-mono text-pink-500 mb-2 tracking-wider">STATUS: LEARNING</div>
                                                    <div className="text-xl font-bold text-white">Optimizing</div>
                                                    <div className="text-xs text-gray-400 mt-2">50k+ interactions</div>
                                                </div>
                                            </div>
                                            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col justify-between hover:-translate-y-2 transition-transform duration-500 shadow-2xl shadow-amber-900/10 aspect-square">
                                                <Bot className="h-10 w-10 text-amber-400 mb-4" />
                                                <div>
                                                    <div className="text-xs font-mono text-amber-500 mb-2 tracking-wider">STATUS: HUNTING</div>
                                                    <div className="text-xl font-bold text-white">Prospecting</div>
                                                    <div className="text-xs text-gray-400 mt-2">300 leads/min</div>
                                                </div>
                                            </div>
                                            <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-6 rounded-3xl flex flex-col justify-between hover:-translate-y-2 transition-transform duration-500 shadow-2xl shadow-emerald-900/10 aspect-square">
                                                <Bot className="h-10 w-10 text-emerald-400 mb-4" />
                                                <div>
                                                    <div className="text-xs font-mono text-emerald-500 mb-2 tracking-wider">STATUS: CLOSING</div>
                                                    <div className="text-xl font-bold text-white">Contract Gen</div>
                                                    <div className="text-xs text-gray-400 mt-2">$42k pipeline</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}

function AgentCard({ icon, role, name, desc }: { icon: React.ReactNode, role: string, name: string, desc: string }) {
    return (
        <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-white/10 to-transparent hover:from-cyan-500/50 hover:to-cyan-900/50 transition-all duration-500">
            <div className="bg-black/90 h-full rounded-2xl p-6 relative overflow-hidden backdrop-blur-xl">
                <div className="absolute top-0 right-0 p-4 opacity-50 font-mono text-xs text-cyan-500">{name}</div>
                <div className="mb-6 p-3 bg-white/5 w-fit rounded-xl group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors">{role}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
            </div>
        </div>
    )
}
