import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import GeometricBackground from "@/app/[locale]/components/GeometricBackground";
import competitors from "@/data/competitors.json";
import { ArrowRight } from "lucide-react";
import MarketingHeader from "@/app/[locale]/components/MarketingHeader";
import MarketingFooter from "@/app/[locale]/components/MarketingFooter";

export const metadata = {
    title: "Compare Ledger1CRM to Competitors | Find Your Best CRM Alternative",
    description: "Compare Ledger1CRM vs Salesforce, HubSpot, Zoho, and more. See why businesses are switching for better AI, lower costs, and superior support.",
    openGraph: {
        title: "Compare Ledger1CRM to Top CRMs",
        description: "Better AI, Lower Costs, Superior Support",
        type: "website",
        url: `${process.env.NEXT_PUBLIC_APP_URL}/compare`,
        images: [
            {
                url: `/api/og?title=Compare Leading CRMs&description=Find Your Perfect Alternative&type=competitor&badge=Comparison Guide`,
                width: 1200,
                height: 630,
                alt: "Compare Ledger1CRM to Competitors",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Compare Ledger1CRM to Top CRMs",
        description: "Better AI, Lower Costs, Superior Support",
        images: ["/api/og?title=Compare Leading CRMs&description=Find Your Perfect Alternative&type=competitor&badge=Comparison Guide"],
    },
};

export default function ComparePage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <MarketingHeader />
            <section className="relative w-full py-20 md:py-32 overflow-hidden">
                <GeometricBackground />
                <div className="container px-4 md:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 mb-6">
                            Compare Ledger1CRM to Any CRM
                        </h1>
                        <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
                            See how Ledger1CRM stacks up against the competition. Lower cost, more features, better AI.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {competitors.map((competitor) => (
                            <Link key={competitor.slug} href={`/compare/${competitor.slug}`}>
                                <Card className="border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-primary/30 transition-all duration-300 h-full group cursor-pointer">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span>vs {competitor.name}</span>
                                            <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            {competitor.comparison_title}
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>
            <MarketingFooter />
        </div>
    );
}
