import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import GeometricBackground from "@/app/[locale]/components/GeometricBackground";
import locations from "@/data/locations.json";
import { ArrowRight, MapPin } from "lucide-react";
import MarketingHeader from "@/app/[locale]/components/MarketingHeader";
import MarketingFooter from "@/app/[locale]/components/MarketingFooter";

export const metadata = {
    title: "Ledger1CRM Available Worldwide | Global AI CRM",
    description: "Ledger1CRM serves businesses in New York, London, Toronto, Sydney, Singapore, and major cities worldwide. Find your local CRM solution.",
    openGraph: {
        title: "Ledger1CRM Available Worldwide",
        description: "Local Support, Global Scale",
        type: "website",
        url: `${process.env.NEXT_PUBLIC_APP_URL}/location`,
        images: [
            {
                url: `/api/og?title=Global AI CRM&description=Available in Major Cities Worldwide&type=location&badge=Global Coverage`,
                width: 1200,
                height: 630,
                alt: "Ledger1CRM Available Worldwide",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Ledger1CRM Available Worldwide",
        description: "Local Support, Global Scale",
        images: ["/api/og?title=Global AI CRM&description=Available in Major Cities Worldwide&type=location&badge=Global Coverage"],
    },
};

export default function LocationsPage() {
    return (
        <div className="min-h-screen bg-background text-foreground">
            <MarketingHeader />
            <section className="relative w-full py-20 md:py-32 overflow-hidden">
                <GeometricBackground />
                <div className="container px-4 md:px-6 relative z-10">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-white via-white/90 to-white/50 mb-6">
                            Available Worldwide
                        </h1>
                        <p className="text-muted-foreground text-xl max-w-3xl mx-auto">
                            Join thousands of businesses using Ledger1CRM to dominate their local markets with global-grade AI.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                        {locations.map((location) => (
                            <Link key={location.slug} href={`/location/${location.slug}`}>
                                <Card className="border border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-primary/30 transition-all duration-300 h-full group cursor-pointer">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-5 h-5 text-primary" />
                                                <span>{location.name}</span>
                                            </div>
                                            <ArrowRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </CardTitle>
                                        <CardDescription className="text-base">
                                            {location.context}
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
