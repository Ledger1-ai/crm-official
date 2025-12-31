import Link from 'next/link';
import { ArrowRight } from "lucide-react";

export default function BasaltHero() {
    return (
        <section id="hero" className="relative min-h-screen flex items-center justify-center px-6 pt-24">
            <div className="max-w-5xl mx-auto text-center z-10">
                {/* System Label */}
                <div className="inline-flex items-center gap-2 mb-8 opacity-0 animate-fadeInUp">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                    <span className="text-xs font-mono tracking-[0.3em] text-cyan-500">
                        AI-POWERED ENTERPRISE CRM
                    </span>
                </div>

                {/* Main Heading */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 opacity-0 animate-fadeInUp stagger-1">
                    <span className="block text-white">YOUR BUSINESS.</span>
                    <span className="block bg-gradient-to-r from-cyan-400 to-teal-500 bg-clip-text text-transparent">
                        SUPERCHARGED.
                    </span>
                </h1>

                {/* Mission Statement */}
                <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed opacity-0 animate-fadeInUp stagger-2">
                    Focus on the features that keep you competitive in this new era.
                    Be excited about business again. The first CRM that doesn't just manage your data—it actively works for you.
                    From finding prospects to closing deals with voice AI, BasaltCRM is your unfair advantage.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 opacity-0 animate-fadeInUp stagger-3">
                    <Link
                        href="https://calendar.google.com/appointments/schedules/AcZssZ2Vduqr0QBnEAM50SeixE8a7kXuKt62zEFjQCQ8_xvoO6iF3hluVQHpaM6RYWMGB110_zM3MUF0"
                        target="_blank"
                        className="h-14 px-10 flex items-center justify-center text-sm font-bold tracking-wider rounded-full bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_30px_rgba(6,182,212,0.4)] hover:shadow-[0_0_50px_rgba(6,182,212,0.6)] transition-all duration-300"
                    >
                        SCHEDULE A DEMO
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                    <Link
                        href="/register"
                        className="h-14 px-10 flex items-center justify-center text-sm font-bold tracking-wider rounded-full border border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300 backdrop-blur-sm"
                    >
                        GET STARTED FREE
                    </Link>
                </div>

                {/* Stats Row */}
                <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 opacity-0 animate-fadeInUp stagger-4">
                    {[
                        { value: '24/7', label: 'AI AGENT AVAILABILITY' },
                        { value: '<100ms', label: 'VOICE LATENCY' },
                        { value: '1M+', label: 'MINUTES PROCESSED' },
                        { value: '100%', label: 'AUTOMATED PIPELINES' },
                    ].map((stat) => (
                        <div key={stat.label} className="text-center group">
                            <div className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 group-hover:from-cyan-400 group-hover:to-teal-500 transition-all duration-300 mb-1">
                                {stat.value}
                            </div>
                            <div className="text-xs font-mono tracking-wider text-gray-500">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 animate-fadeInUp stagger-5">
                <Link href="#features" className="flex flex-col items-center gap-2 text-gray-500 hover:text-cyan-500 transition-colors">
                    <span className="text-xs font-mono tracking-wider">SCROLL</span>
                    <svg className="w-5 h-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                </Link>
            </div>
        </section>
    );
}
