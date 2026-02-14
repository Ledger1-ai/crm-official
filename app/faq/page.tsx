// @ts-nocheck
export const dynamic = "force-dynamic";
import React from "react";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/components/GeometricBackground";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export const metadata = {
    title: "FAQ - BasaltCRM",
    description: "Frequently asked questions about BasaltCRM.",
};

export default function FAQPage() {
    const faqs = [
        {
            question: "What is BasaltCRM?",
            answer: "BasaltCRM is an AI-powered Customer Relationship Management platform designed to help SMEs automate sales, support, and marketing workflows using advanced predictive analytics and autonomous agents.",
        },
        {
            question: "How does the AI predictive analytics work?",
            answer: "Our AI analyzes your historical sales data, email interactions, and customer behavior to assign a 'win probability' score to every lead. This helps your sales team focus on the deals most likely to close.",
        },
        {
            question: "Can I self-host BasaltCRM?",
            answer: "Yes! We offer an open-source Community Edition that you can deploy on your own infrastructure. For enterprise features and support, we offer a cloud-hosted version and an Enterprise self-hosted license.",
        },
        {
            question: "Is my data secure?",
            answer: "Absolutely. We use bank-grade AES-256 encryption for data at rest and TLS 1.3 for data in transit. Our cloud platform is SOC2 Type II compliant.",
        },
        {
            question: "Do you offer a free trial?",
            answer: "Yes, we offer a 14-day free trial for our Pro plan. No credit card required. You can also use our Free Starter plan forever.",
        },
        {
            question: "What integrations do you support?",
            answer: "We integrate with over 5,000 apps via Zapier. Native integrations include Google Workspace, Microsoft 365, Slack, Stripe, and QuickBooks.",
        },
        {
            question: "Can I import data from Salesforce or HubSpot?",
            answer: "Yes, we offer one-click migration tools for Salesforce, HubSpot, Pipedrive, and Zoho CRM. Our support team can also assist with complex data migrations.",
        },
        {
            question: "How do the autonomous support agents work?",
            answer: "Our agents use Large Language Models (LLMs) to understand and respond to customer support tickets. They can resolve common queries, route complex issues to humans, and even perform actions like processing refunds.",
        },
        {
            question: "What happens if I exceed my AI credit limit?",
            answer: "If you reach your limit, you can purchase additional credit packs or upgrade to a higher tier plan. We will notify you when you reach 80% and 100% of your usage.",
        },
        {
            question: "Do you offer discounts for non-profits?",
            answer: "Yes, we offer a 50% discount for registered non-profit organizations and educational institutions. Contact our sales team for more details.",
        },
        {
            question: "Can I customize the dashboard?",
            answer: "Yes, the dashboard is fully customizable. You can drag and drop widgets, create custom reports, and set up personalized views for different team members.",
        },
        {
            question: "What kind of support do you offer?",
            answer: "All plans include access to our community forum and documentation. Pro plans include priority email support, and Enterprise plans include a dedicated Customer Success Manager and 24/7 phone support.",
        },
    ];

    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="py-20 md:py-32">
                    <div className="container mx-auto px-4 max-w-3xl">
                        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6 text-center">
                            Frequently Asked <span className="text-primary">Questions</span>
                        </h1>
                        <p className="text-xl text-gray-400 text-center mb-16">
                            Everything you need to know about BasaltCRM.
                        </p>

                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {faqs.map((faq, index) => (
                                <AccordionItem key={index} value={`item-${index}`} className="border border-white/10 bg-white/5 rounded-xl px-4 data-[state=open]:border-primary/50 transition-colors">
                                    <AccordionTrigger className="text-lg font-medium hover:text-primary hover:no-underline py-6">
                                        {faq.question}
                                    </AccordionTrigger>
                                    <AccordionContent className="text-gray-400 text-base pb-6 leading-relaxed">
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    </div>
                </main>

                <BasaltFooter />
            </div>
        </div>
    );
}
