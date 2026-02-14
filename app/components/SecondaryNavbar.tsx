import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default function SecondaryNavbar() {
    const secondaryLinks = [
        { label: "Compare Us", href: "/compare" },
        { label: "Industries", href: "/industry" },
        { label: "Locations", href: "/location" },
    ];

    return (
        <div className="bg-[#0A0A12] border-b border-white/5 py-2 hidden lg:block">
            <div className="container mx-auto px-4 lg:px-6 flex justify-end items-center gap-6">
                <nav className="flex items-center gap-6">
                    {secondaryLinks.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="text-xs font-medium text-gray-400 hover:text-white transition-colors flex items-center group"
                        >
                            {link.label}
                            <ChevronRight className="h-3 w-3 ml-1 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                    ))}
                </nav>
            </div>
        </div>
    );
}
