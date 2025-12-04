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
                            Your 24/7 AI workforce. Sales, Support, and Growth on autopilot.
                        </p>
                    </div>

                    {/* Column 2: Product */}
                    <div className="flex flex-col items-center md:items-start space-y-4 border-t border-gray-800/50 pt-8 md:border-t-0 md:pt-0">
                        <h3 className="text-white font-semibold text-base">Product</h3>
                        <ul className="flex flex-col items-center md:items-start space-y-3 text-sm">
                            <li><Link href="/features" className="hover:text-white transition-colors">Features</Link></li>
                            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>


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
                        <a href="https://x.com/Ledger1AI" target="_blank" rel="noopener noreferrer" aria-label="Follow Ledger on X" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z" /><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772" /></svg>
                        </a>
                        {/* Discord */}
                        <a href="https://discord.gg/vARPqF84Zt" target="_blank" rel="noopener noreferrer" aria-label="Follow Ledger on Discord" className="text-white hover:text-white/90 hover:scale-110 transition-transform duration-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 127.14 96.36" fill="currentColor">
                                <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22c2.36-24.44-2-47.27-18.9-72.15ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                            </svg>
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
