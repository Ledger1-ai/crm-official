// @ts-nocheck
export const dynamic = "force-dynamic";
import { Metadata } from "next";
import GeometricBackground from "./components/GeometricBackground";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltHero from "@/components/basaltcrm-landing/BasaltHero";
import BasaltFeatures from "@/components/basaltcrm-landing/BasaltFeatures";
import BasaltSEO from "@/components/basaltcrm-landing/BasaltSEO";
import BasaltAbout from "@/components/basaltcrm-landing/BasaltAbout";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";

export const metadata: Metadata = {
    title: "BasaltCRM – AI Sales & Support Engine",
    description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
    keywords: ["AI CRM", "Sales AI", "Customer Support Bot", "SME CRM", "Next.js CRM"],
    openGraph: {
        title: "BasaltCRM – AI Sales & Support Engine",
        description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
        type: "website",
        url: "https://crm.basalthq.com",
        images: [
            {
                url: "https://crm.basalthq.com/social-preview.jpg",
                width: 1200,
                height: 630,
                alt: "BasaltCRM – AI Sales & Support Engine",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "BasaltCRM – AI Sales & Support Engine",
        description: "Automated prospecting, social intelligence, and 24/7 AI agents that never sleep.",
        images: ["https://crm.basalthq.com/social-preview.jpg"],
    },
};

const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "BasaltCRM",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web",
    "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "description": "Community Edition"
    },
    "featureList": ["Predictive Sales AI", "Autonomous Support Agents"],
    "description": "An AI CRM that combines predictive sales analytics with autonomous customer support agents."
};

export default function LandingPage() {
    return (
        <div className="dark min-h-screen bg-black text-white font-sans selection:bg-cyan-500/30">
            {/* Global Background - Fixed to cover detailed sections */}
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            {/* Content Overlay */}
            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="flex-grow">
                    <BasaltHero />
                    <BasaltFeatures />
                    <BasaltSEO />
                    <BasaltAbout />
                </main>

                <BasaltFooter />
            </div>

            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
        </div>
    );
}

