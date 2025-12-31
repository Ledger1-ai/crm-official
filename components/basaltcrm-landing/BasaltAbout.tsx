import { ShieldCheck, Globe, Zap, CheckCircle2 } from "lucide-react";

export default function BasaltAbout() {
    return (
        <section id="about" className="relative py-24 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-16 items-start mb-24">
                    {/* Left Content */}
                    <div>
                        <span className="section-heading">ABOUT BASALT</span>
                        <h2 className="section-title mt-4 mb-6">AI-First Customer Relationships</h2>

                        <div className="space-y-6 text-gray-300 leading-relaxed">
                            <p>
                                <span className="text-cyan-500 font-semibold">BasaltCRM</span> is the foundation of
                                the next generation of business intelligence. We integrate autonomous agents
                                that empower sales teams while driving efficiency and predictability in revenue ops.
                            </p>
                            <p>
                                By fostering symbiotic relationships between human strategy and AI execution, we
                                believe in technology's potential to eliminate the grind of sales and support,
                                allowing teams to focus on what matters most: closing deals and building relationships.
                            </p>
                        </div>

                        {/* Mission Statement Card */}
                        <div className="mt-8 p-6 glass-panel rounded-2xl border-l-4 border-cyan-500">
                            <p className="text-sm text-gray-400 italic">
                                &ldquo;A self-driving growth engine that operates 24/7. Freedom from repetitive tasks.
                                Confidence in your pipeline. A business that grows even when you're not watching.&rdquo;
                            </p>
                        </div>
                    </div>

                    {/* Right Content - Values */}
                    <div className="space-y-6">
                        {/* Values Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                {
                                    title: 'SECURE',
                                    desc: 'Bank-grade encryption & SOC2 ready',
                                    icon: <ShieldCheck className="w-5 h-5" />
                                },
                                {
                                    title: 'GLOBAL',
                                    desc: 'Multilingual support in 100+ languages',
                                    icon: <Globe className="w-5 h-5" />
                                },
                                {
                                    title: 'FAST',
                                    desc: 'Real-time processing <100ms latency',
                                    icon: <Zap className="w-5 h-5" />
                                },
                                {
                                    title: 'RELIABLE',
                                    desc: '99.9% Uptime SLA guaranteed',
                                    icon: <CheckCircle2 className="w-5 h-5" />
                                },
                            ].map((value) => (
                                <div key={value.title} className="card group">
                                    <div className="text-cyan-500 mb-2 group-hover:scale-110 transition-transform">
                                        {value.icon}
                                    </div>
                                    <h4 className="text-xs font-mono tracking-wider text-cyan-500 mb-2">
                                        {value.title}
                                    </h4>
                                    <p className="text-sm text-gray-400">{value.desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Performance Metrics */}
                        <div className="glass-panel rounded-2xl p-6">
                            <h4 className="text-xs font-mono tracking-wider text-gray-500 mb-4">
                                SYSTEM METRICS
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Scalability', desc: 'Auto-scaling agent fleets' },
                                    { label: 'Accuracy', desc: '98% Intent recognition rate' },
                                    { label: 'Integration', desc: 'Connects with 5000+ apps' },
                                    { label: 'Support', desc: '24/7 Autonomous resolution' },
                                ].map((metric) => (
                                    <div key={metric.label} className="flex items-start gap-2">
                                        <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full mt-2" />
                                        <div>
                                            <span className="text-sm font-semibold text-white">{metric.label}</span>
                                            <p className="text-xs text-gray-500">{metric.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Extended Team Section (Optional - kept if needed, or replaced with something else) */}
                {/* For now, I'll comment out the team section as it might not be relevant if they don't have a large team to show yet, or I can replace it with "Trusted By" logos later if they have them. 
                    Given the request is to align with the template, and the template has it, I will retain a placeholder structure but maybe generic or skip if no data. 
                     I'll skip the team section for now to focus on the product, unless specifically asked. The prompt said "fit the style of the template exactly", so maybe I should add a section there. 
                     Let's add a "Powered By" or "Technology Stack" section instead of Team to keep the layout similar. */}

                <div className="border-t border-white/10 pt-16">
                    <div className="text-center mb-12">
                        <span className="section-heading">OUR ENGINE</span>
                        <h2 className="section-title mt-4">Powered By Next-Gen Tech</h2>
                        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                            Built on the most advanced AI and blockchain infrastructure available today.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {/* Placeholder tech logos text for now */}
                        {['OpenAI', 'Anthropic', 'Supabase', 'Vercel'].map((tech) => (
                            <div key={tech} className="group text-center p-6 glass-panel rounded-xl hover:bg-white/5 transition-all">
                                <h4 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">{tech}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
