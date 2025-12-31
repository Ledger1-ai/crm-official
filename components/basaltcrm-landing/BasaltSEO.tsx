
import Link from 'next/link';
import { ArrowRight, Globe, Layers, MapPin } from 'lucide-react';

export default function BasaltSEO() {
    return (
        <section id="seo-pages" className="relative py-24 px-6 border-t border-white/5">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="section-heading">EXPLORE BASALT</span>
                    <h2 className="section-title mt-4">Tailored to Your Needs</h2>
                    <p className="text-gray-400 mt-4 max-w-2xl mx-auto text-lg">
                        Discover how BasaltCRM adapts to specific industries, locations, and how we stack up against the competition.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Industries */}
                    <Link href="/industry" className="block">
                        <div className="glass-panel p-8 rounded-2xl group hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors pointer-events-none" />
                            <div className="mb-6 w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 group-hover:bg-cyan-500/20 transition-colors">
                                <Layers className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Industry Solutions</h3>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Specialized AI models and workflows designed for Real Estate, Healthcare, Finance, and more.
                            </p>
                            <span className="inline-flex items-center text-cyan-500 group-hover:text-cyan-400 font-semibold tracking-wide text-sm transition-colors">
                                VIEW INDUSTRIES <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </Link>

                    {/* Locations */}
                    <Link href="/location" className="block">
                        <div className="glass-panel p-8 rounded-2xl group hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-colors pointer-events-none" />
                            <div className="mb-6 w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                                <MapPin className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Global Availability</h3>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                Serving businesses in major cities worldwide with localized support and compliance.
                            </p>
                            <span className="inline-flex items-center text-purple-500 group-hover:text-purple-400 font-semibold tracking-wide text-sm transition-colors">
                                FIND YOUR CITY <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </Link>

                    {/* Comparisons */}
                    <Link href="/compare" className="block">
                        <div className="glass-panel p-8 rounded-2xl group hover:-translate-y-1 transition-all duration-300 h-full relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/20 transition-colors pointer-events-none" />
                            <div className="mb-6 w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500/20 transition-colors">
                                <Globe className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-3">Compare Alternatives</h3>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                See why businesses are switching from Salesforce, HubSpot, and Zoho to BasaltCRM.
                            </p>
                            <span className="inline-flex items-center text-emerald-500 group-hover:text-emerald-400 font-semibold tracking-wide text-sm transition-colors">
                                COMPARE <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
                            </span>
                        </div>
                    </Link>
                </div>
            </div>
        </section>
    );
}
