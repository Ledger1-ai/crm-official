'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";

const navLinks = [
    { label: 'HOME', href: '#hero' },
    { label: 'FEATURES', href: '/features' },
    { label: 'AI AGENTS', href: '/ai-agents' },
    { label: 'PRICING', href: '/pricing' },
];

const externalLinks: { label: string; href: string; internal?: boolean }[] = [
    { label: 'BASALT ECHO', href: 'https://echo.basalthq.com', internal: false },
    { label: 'LOGIN', href: '/sign-in', internal: true },
];

interface NavbarProps {
    themeColor?: string;
}

export default function BasaltNavbar({ themeColor = '#06b6d4' }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [time, setTime] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };

        const tick = () => {
            setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        };
        tick();
        const interval = setInterval(tick, 1000);

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            clearInterval(interval);
        };
    }, []);

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out ${scrolled
                    ? 'bg-black/60 backdrop-blur-2xl border-b shadow-[0_4px_30px_rgba(0,0,0,0.1)] py-3'
                    : 'py-5 bg-transparent'
                    }`}
                style={scrolled ? { borderBottomColor: `${themeColor}30`, boxShadow: `0 4px 30px ${themeColor}10` } : { borderBottomColor: 'transparent' }}
            >
                <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
                    {/* Logo & System Status */}
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="relative w-10 h-10 transform group-hover:scale-110 transition-transform duration-300">
                                <Image
                                    src="/CRM-ERP-CMS.png"
                                    alt="Basalt Shield"
                                    fill
                                    className="object-contain"
                                    priority
                                />
                                <div className="shield-gleam-container" />
                            </div>
                            <div className="flex flex-col">
                                <span className="hidden md:block text-xs font-mono tracking-widest opacity-80 transition-colors" style={{ color: themeColor }}>
                                    STATUS.ONLINE
                                </span>
                                <span className="text-lg text-white tracking-widest group-hover:opacity-80 transition-opacity" style={{ fontFamily: '"vox", sans-serif' }}>
                                    <span style={{ fontWeight: 300 }}>BASALT</span><span style={{ fontWeight: 700 }}>CRM</span>
                                </span>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden xl:flex items-center gap-1">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="px-4 py-2 text-xs font-mono tracking-wider text-gray-400 hover:text-white hover:bg-white/5 rounded-[10px] transition-all duration-200"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Right Side */}
                    <div className="flex items-center gap-4">
                        {/* Time Display */}
                        <div className="hidden md:block text-xs font-mono tracking-wider" style={{ color: themeColor }}>
                            {time}
                        </div>

                        {/* External Links */}
                        <div className="hidden xl:flex items-center gap-2">
                            {externalLinks.map((link) => (
                                link.internal ? (
                                    <Link
                                        key={link.label}
                                        href={link.href}
                                        className="px-3 py-1.5 text-[10px] font-mono tracking-wider text-gray-500 hover:text-white border border-white/10 hover:border-white/30 rounded-[10px] transition-all duration-200"
                                        style={{ '--hover-color': themeColor } as React.CSSProperties}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = themeColor}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    >
                                        {link.label}
                                    </Link>
                                ) : (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 text-[10px] font-mono tracking-wider text-gray-500 hover:text-white border border-white/10 hover:border-white/30 rounded-[10px] transition-all duration-200"
                                        style={{ '--hover-color': themeColor } as React.CSSProperties}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = themeColor}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}
                                    >
                                        {link.label}
                                    </a>
                                )
                            ))}
                        </div>

                        {/* CTA Button */}
                        <Link
                            href="/register"
                            className="text-xs font-mono tracking-wider px-6 py-3 rounded-[10px] bg-white text-black font-bold hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: themeColor, color: '#000' }}
                        >
                            GET STARTED
                        </Link>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="xl:hidden p-2 text-white transition-colors"
                            style={{ color: mobileMenuOpen ? themeColor : 'white' }}
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="xl:hidden bg-black/80 backdrop-blur-xl mt-2 mx-4 rounded-2xl p-4 animate-fadeInUp border" style={{ borderColor: `${themeColor}40` }}>
                        <div className="flex flex-col gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="px-4 py-3 text-sm font-mono tracking-wider text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-all"
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <div className="border-t border-white/10 mt-2 pt-2">
                                {externalLinks.map((link) => (
                                    link.internal ? (
                                        <Link
                                            key={link.label}
                                            href={link.href}
                                            onClick={() => setMobileMenuOpen(false)}
                                            className="block px-4 py-2 text-xs font-mono tracking-wider text-gray-500 hover:text-white transition-colors"
                                            style={{ color: '#9ca3af' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = themeColor}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                        >
                                            {link.label}
                                        </Link>
                                    ) : (
                                        <a
                                            key={link.label}
                                            href={link.href}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block px-4 py-2 text-xs font-mono tracking-wider text-gray-500 hover:text-white transition-colors"
                                            style={{ color: '#9ca3af' }}
                                            onMouseEnter={(e) => e.currentTarget.style.color = themeColor}
                                            onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                                        >
                                            ↗ {link.label}
                                        </a>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* HUD Decorative Lines */}
            <div className="fixed top-20 left-0 right-0 pointer-events-none z-40 opacity-50">
                <div className="absolute h-px bg-gradient-to-r from-transparent via-current to-transparent w-full" style={{ color: themeColor }} />
            </div>
        </>
    );
}
