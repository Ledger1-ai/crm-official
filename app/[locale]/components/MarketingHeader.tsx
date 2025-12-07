"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";

import SecondaryNavbar from "./SecondaryNavbar";

/**
 * Public marketing navbar used across marketing pages.
 * Universal sticky header with mobile menu overlay.
 */
export default function MarketingHeader() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Lock body scroll when mobile menu is open
    useEffect(() => {
        if (isMobileMenuOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isMobileMenuOpen]);

    const navLinks = [
        { label: "Features", href: "/features" },
        { label: "Pricing", href: "/pricing" },

        { label: "FAQ", href: "/faq" },
        { label: "Blog", href: "/blog" },
        { label: "Support", href: "/support" },
    ];

    return (
        <>
            <SecondaryNavbar />
            <header className="h-20 flex items-center border-b border-white/10 bg-[#0F0F1A]/15 backdrop-blur-md sticky top-0 z-50 w-full shadow-sm">
                <div className="container mx-auto px-4 lg:px-6 flex items-center justify-between h-full">
                    {/* Logo */}
                    <Link className="flex items-center justify-center z-50 relative" href="/" aria-label="Ledger AI Home">
                        <Image
                            src="/logo.png"
                            alt="Ledger AI Logo"
                            width={180}
                            height={50}
                            className="object-contain h-10 w-auto brightness-200 contrast-125"
                            priority
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                                href={link.href}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden lg:flex items-center gap-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10 rounded-full">
                                Login
                            </Button>
                        </Link>
                        <Link href="/register">
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-6 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all rounded-full">
                                Get Started
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <button
                        className="lg:hidden z-50 relative text-white p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                    >
                        {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-[#0F0F1A] z-40 flex flex-col pt-24 px-6 pb-8 lg:hidden overflow-y-auto">
                    <nav className="flex flex-col gap-6 items-center">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-2xl font-medium text-gray-300 hover:text-white transition-colors w-full text-center py-2"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="w-full h-px bg-white/10 my-4" />
                        <Link href="/dashboard" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button variant="ghost" className="w-full text-lg h-12 text-gray-300 hover:text-white hover:bg-white/10 rounded-full">
                                Login
                            </Button>
                        </Link>
                        <Link href="/register" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                            <Button className="w-full text-lg h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] rounded-full">
                                Get Started
                            </Button>
                        </Link>
                    </nav>

                    {/* Mobile Social Icons */}
                    <div className="mt-auto pt-12 flex justify-center gap-8">
                        {/* Twitter/X */}
                        <a href="#" aria-label="Follow Ledger on X" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
                        </a>
                        {/* Discord */}
                        <a href="#" aria-label="Follow Ledger on Discord" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="2" /><path d="M7.5 7.5c3.5-1 5.5-1 9 0" /><path d="M7 16.5c3.5 1 5.5 1 9 0" /><path d="M15.5 17c0-1.5.5-2 1.5-2s1.5.5 1.5 2" /><path d="M8.5 17c0-1.5-.5-2-1.5-2s-1.5.5-1.5 2" /></svg>
                        </a>
                        {/* LinkedIn */}
                        <a href="#" aria-label="Follow Ledger on LinkedIn" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                        </a>
                        {/* GitHub */}
                        <a href="#" aria-label="Follow Ledger on GitHub" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                        </a>
                        {/* YouTube */}
                        <a href="#" aria-label="Follow Ledger on YouTube" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                        </a>
                    </div>
                </div>
            )}
        </>
    );
}
