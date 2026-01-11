import Link from 'next/link';
import Image from 'next/image';

const navigationLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'Features', href: '#features' },
    { label: 'AI Agents', href: '#ai-agents' },
    { label: 'Pricing', href: '#pricing' },
];

const ecosystemLinks = [
    { label: 'Basalt Echo', href: 'https://echo.basalthq.com' },
    { label: 'Developer API', href: '/developers' },
    { label: 'Status', href: 'https://status.basalthq.com' },
];

const socialLinks = [
    { label: 'Twitter', href: 'https://twitter.com/BasaltHQ' },
    { label: 'LinkedIn', href: 'https://linkedin.com/company/basalthq' },
    { label: 'GitHub', href: 'https://github.com/basalthq' },
    { label: 'Discord', href: 'https://discord.gg/gcgNugyWkg' },
];

export default function BasaltFooter() {
    return (
        <footer className="relative py-16 px-6 border-t border-white/10 mt-24">
            <div className="max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Brand Column */}
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="relative w-12 h-12">
                                <Image
                                    src="/CRM-ERP-CMS.png"
                                    alt="Basalt Shield"
                                    fill
                                    className="object-contain"
                                />
                                <div className="shield-gleam-container" />
                            </div>
                            <div>
                                <span className="text-white text-xl tracking-widest" style={{ fontFamily: '"vox", sans-serif' }}>
                                    <span style={{ fontWeight: 300 }}>BASALT</span><span style={{ fontWeight: 700 }}>CRM</span>
                                </span>
                                <p className="text-[10px] text-cyan-500 font-mono mt-1 whitespace-nowrap">AI-POWERED RELATIONSHIPS</p>
                            </div>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            <span className="text-cyan-500 font-semibold">Your Business. Supercharged.</span> Empowering companies with autonomous AI agents that drive revenue and customer satisfaction.
                        </p>
                        <a
                            href="mailto:hello@basalthq.com"
                            className="text-cyan-500 text-sm hover:underline"
                        >
                            hello@basalthq.com
                        </a>
                    </div>

                    {/* Navigation */}
                    <div>
                        <h4 className="text-xs font-mono tracking-wider text-gray-500 mb-4">NAVIGATE</h4>
                        <ul className="space-y-2">
                            {navigationLinks.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-gray-400 text-sm hover:text-white transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Ecosystem */}
                    <div>
                        <h4 className="text-xs font-mono tracking-wider text-gray-500 mb-4">ECOSYSTEM</h4>
                        <ul className="space-y-2">
                            {ecosystemLinks.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        target={link.href.startsWith("http") ? "_blank" : undefined}
                                        rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
                                        className="text-gray-400 text-sm hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        {link.label}
                                        {link.href.startsWith("http") && (
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 0 00-2 2v10a2 0 002 2h10a2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        )}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Connect */}
                    <div>
                        <h4 className="text-xs font-mono tracking-wider text-gray-500 mb-4">CONNECT</h4>
                        <ul className="space-y-2">
                            {socialLinks.map((link) => (
                                <li key={link.label}>
                                    <a
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-gray-400 text-sm hover:text-cyan-500 transition-colors"
                                    >
                                        {link.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-8">
                            <h4 className="text-xs font-mono tracking-wider text-gray-500 mb-2">STATUS</h4>
                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="text-xs text-emerald-500 font-mono">ALL SYSTEMS OPERATIONAL</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-gray-500 text-xs">
                        © {new Date().getFullYear()} BasaltHQ. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <Link href="/privacy" className="text-gray-500 text-xs hover:text-white transition-colors">
                            Privacy Policy
                        </Link>
                        <Link href="/terms" className="text-gray-500 text-xs hover:text-white transition-colors">
                            Terms of Service
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
