import Link from "next/link";
import Image from "next/image";

/**
 * Public marketing footer used across marketing pages.
 * Mirrors the footer from app/[locale]/page.tsx and does not depend on session.
 */
export default function MarketingFooter() {
    return (
        <footer className="w-full bg-[#0F0F1A] text-[#94A3B8] font-sans border-t border-gray-800/50">
            <div className="max-w-7xl mx-auto px-6 py-12 lg:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-10 xl:gap-8">

                    {/* Column 1: Logo & Tagline */}
                    <div className="flex flex-col items-center md:items-start space-y-4">
                        <Link href="/" className="flex items-center gap-2" aria-label="Ledger1 Home">
                            <Image
                                src="/logo.png"
                                alt="Ledger AI Logo"
                                width={150}
                                height={40}
                                className="object-contain h-8 w-auto brightness-200 contrast-125"
                            />
                        </Link>
                        <p className="text-sm text-center md:text-left max-w-xs">
                            AI-Powered CRM for Modern Teams
                        </p>
                    </div>

                    {/* Column 2: Product */}
                    <div className="flex flex-col items-center md:items-start space-y-4 border-t border-gray-800/50 pt-8 md:border-t-0 md:pt-0">
                        <h3 className="text-white font-semibold text-base">Product</h3>
                        <ul className="flex flex-col items-center md:items-start space-y-3 text-sm">
                            <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                            <li><Link href="/changelog" className="hover:text-white transition-colors">Changelog</Link></li>
                            <li><Link href="/roadmap" className="hover:text-white transition-colors">Roadmap</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Company */}
                    <div className="flex flex-col items-center md:items-start space-y-4 border-t border-gray-800/50 pt-8 md:border-t-0 md:pt-0">
                        <h3 className="text-white font-semibold text-base">Company</h3>
                        <ul className="flex flex-col items-center md:items-start space-y-3 text-sm">
                            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                            <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                            <li><Link href="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                            <li><Link href="/support" className="hover:text-white transition-colors">Contact</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Legal */}
                    <div className="flex flex-col items-center md:items-start space-y-4 border-t border-gray-800/50 pt-8 md:border-t-0 md:pt-0">
                        <h3 className="text-white font-semibold text-base">Legal</h3>
                        <ul className="flex flex-col items-center md:items-start space-y-3 text-sm">
                            <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="/cookies" className="hover:text-white transition-colors">Cookie Policy</Link></li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section: Socials & Copyright */}
                <div className="mt-12 pt-8 border-t border-gray-800/50 flex flex-col items-center space-y-6">
                    {/* Social Icons */}
                    <div className="flex items-center space-x-6">
                        {/* Twitter/X */}
                        <a href="#" aria-label="Follow Ledger on X" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
                        </a>
                        {/* Discord */}
                        <a href="#" aria-label="Follow Ledger on Discord" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="2" /><path d="M7.5 7.5c3.5-1 5.5-1 9 0" /><path d="M7 16.5c3.5 1 5.5 1 9 0" /><path d="M15.5 17c0-1.5.5-2 1.5-2s1.5.5 1.5 2" /><path d="M8.5 17c0-1.5-.5-2-1.5-2s-1.5.5-1.5 2" /></svg>
                        </a>
                        {/* LinkedIn */}
                        <a href="#" aria-label="Follow Ledger on LinkedIn" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect width="4" height="12" x="2" y="9" /><circle cx="4" cy="4" r="2" /></svg>
                        </a>
                        {/* GitHub */}
                        <a href="#" aria-label="Follow Ledger on GitHub" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
                        </a>
                        {/* YouTube */}
                        <a href="#" aria-label="Follow Ledger on YouTube" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" /><path d="m10 15 5-3-5-3z" /></svg>
                        </a>
                    </div>

                    {/* Copyright */}
                    <p className="text-xs text-[#647084]">
                        &copy; 2025 Ledger AI. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
