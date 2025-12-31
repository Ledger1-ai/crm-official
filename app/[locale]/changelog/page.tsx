import React from "react";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/[locale]/components/GeometricBackground";

export const metadata = {
    title: "Changelog - BasaltCRM",
    description: "See what's new in BasaltCRM.",
};

export const dynamic = "force-dynamic";

export default function ChangelogPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="py-20 md:py-32">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-12 text-center">
                            Changelog
                        </h1>

                        <div className="space-y-12 relative border-l border-white/10 ml-4 md:ml-0 pl-8 md:pl-0">
                            {/* Update 1 */}
                            <ChangelogItem
                                date="December 1, 2025"
                                version="v2.1.0"
                                title="New AI Agents & Mobile App"
                                description="We've completely overhauled our autonomous agents with improved reasoning capabilities. Plus, the new mobile app is now available on iOS and Android."
                                changes={[
                                    "Added 'Agent Smith' for customer support",
                                    "Released iOS and Android mobile apps",
                                    "Improved dashboard load times by 40%",
                                    "Fixed issue with email sync",
                                ]}
                            />

                            {/* Update 2 */}
                            <ChangelogItem
                                date="November 15, 2025"
                                version="v2.0.5"
                                title="Advanced Reporting Dashboard"
                                description="Get deeper insights into your sales pipeline with our new customizable reporting dashboard."
                                changes={[
                                    "Customizable widgets for dashboard",
                                    "Export reports to PDF and CSV",
                                    "New 'Sales Velocity' metric",
                                ]}
                            />

                            {/* Update 3 */}
                            <ChangelogItem
                                date="October 28, 2025"
                                version="v2.0.0"
                                title="BasaltCRM 2.0 Launch"
                                description="The biggest update yet. A complete redesign of the UI, new branding, and a powerful new API."
                                changes={[
                                    "Complete UI redesign",
                                    "Public API v2 release",
                                    "Dark mode enabled by default",
                                    "Integrated Zapier support",
                                ]}
                            />
                        </div>
                    </div>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}

function ChangelogItem({
    date,
    version,
    title,
    description,
    changes,
}: {
    date: string;
    version: string;
    title: string;
    description: string;
    changes: string[];
}) {
    return (
        <div className="relative md:grid md:grid-cols-5 md:gap-8">
            <div className="md:col-span-1 mb-4 md:mb-0 md:text-right">
                <div className="absolute -left-[39px] md:left-auto md:-right-[41px] top-1 h-5 w-5 rounded-full border-4 border-[#0F0F1A] bg-primary" />
                <p className="text-sm text-gray-400 font-medium">{date}</p>
                <p className="text-xs text-primary font-mono mt-1">{version}</p>
            </div>
            <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-primary/30 transition-colors">
                <h2 className="text-2xl font-bold mb-3">{title}</h2>
                <p className="text-gray-400 mb-6">{description}</p>
                <ul className="space-y-2">
                    {changes.map((change, index) => (
                        <li key={index} className="flex items-start text-sm text-gray-300">
                            <span className="mr-2 text-primary">•</span>
                            {change}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
