import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import GeometricBackground from "@/app/[locale]/components/GeometricBackground";
import industries from "@/data/industries.json";
import { ArrowRight } from "lucide-react";
import MarketingHeader from "@/app/[locale]/components/MarketingHeader";
import MarketingFooter from "@/app/[locale]/components/MarketingFooter";

export const metadata = {
    title: "AI CRM Solutions by Industry | Ledger1CRM",
    description: "Discover how Ledger1CRM serves Real Estate, Healthcare, Legal, Finance, E-commerce, and more with industry-specific AI automation.",
    openGraph: {
        title: "Industry-Specific AI CRM Solutions",
        description: "Built for Your Industry's Unique Needs",
        type: "website",
        url: `${process.env.NEXT_PUBLIC_APP_URL}/industry`,
        images: [
            {
                url: `/api/og?title=AI CRM by Industry&description=Tailored Solutions for Every Sector&type=industry&badge=Industry Solutions`,
                width: 1200,
                height: 630,
                alt: "AI CRM Solutions by Industry",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Industry-Specific AI CRM Solutions",
        description: "Built for Your Industry's Unique Needs",
        images: ["/api/og?title=AI CRM by Industry&description=Tailored Solutions for Every Sector&type=industry&badge=Industry Solutions"],
    },
};

export default function IndustriesPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <MarketingHeader />
            <section className="relative w-full py-20 md:py-32 overflow-hidden">
                <GeometricBackground />
                <div className="container px-4 md:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 mb-6">
                            Built for Your Industry
                        </h1>
                        <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
                            Ledger1CRM adapts to the unique challenges of your sector. Explore industry-specific solutions.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {industries.map((industry) => (
                            <Link key={industry.slug} href={`/industry/${industry.slug}`}>
                                <Card className="border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-primary/30 transition-all duration-300 h-full group cursor-pointer">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span>{industry.name}</span>
                                            <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            {industry.use_case}
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
