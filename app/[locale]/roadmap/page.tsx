import React from "react";
import BasaltNavbar from "@/components/basaltcrm-landing/BasaltNavbar";
import BasaltFooter from "@/components/basaltcrm-landing/BasaltFooter";
import GeometricBackground from "@/app/[locale]/components/GeometricBackground";
import { CheckCircle2, Circle, Clock } from "lucide-react";

export const metadata = {
    title: "Roadmap - BasaltCRM",
    description: "See what we've built and what's coming next for BasaltCRM.",
};

export default function RoadmapPage() {
    return (
        <div className="min-h-screen text-white font-sans selection:bg-cyan-500/30">
            <div className="fixed inset-0 z-0">
                <GeometricBackground />
            </div>

            <div className="relative z-10 flex flex-col min-h-screen">
                <BasaltNavbar />

                <main className="py-20 md:py-32">
                    <div className="container mx-auto px-4 max-w-4xl">
                        <div className="text-center mb-20">
                            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
                                Product <span className="text-primary">Roadmap</span>
                            </h1>
                            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                                We&apos;re building the future of AI-driven customer relationship management. Here&apos;s what we&apos;ve done and where we&apos;re going.
                            </p>
                        </div>

                        <div className="space-y-12 relative border-l-2 border-white/10 ml-4 md:ml-0 pl-8 md:pl-0">
                            {/* Q4 2025 - Completed */}
                            <RoadmapItem
                                quarter="Q4 2025"
                                status="completed"
                                title="Autonomous Agents & Mobile"
                                items={[
                                    "Launch of 'Agent Smith' for autonomous support",
                                    "iOS and Android mobile applications",
                                    "Real-time voice transcription for calls",
                                    "Advanced role-based access control (RBAC)",
                                ]}
                            />

                            {/* Q1 2026 - In Progress */}
                            <RoadmapItem
                                quarter="Q1 2026"
                                status="in-progress"
                                title="Deep Integration & Intelligence"
                                items={[
                                    "Native integration with Microsoft Teams",
                                    "Sentiment analysis for email threads",
                                    "Predictive churn modeling",
                                    "Self-hosted Docker container registry",
                                ]}
                            />

                            {/* Q2 2026 - Planned */}
                            <RoadmapItem
                                quarter="Q2 2026"
                                status="planned"
                                title="Global Scale & Customization"
                                items={[
                                    "Multi-currency support for deals",
                                    "Custom AI model fine-tuning interface",
                                    "White-labeling for Enterprise clients",
                                    "API v3 with GraphQL support",
                                ]}
                            />

                            {/* Q3 2026 - Planned */}
                            <RoadmapItem
                                quarter="Q3 2026"
                                status="planned"
                                title="The Next Frontier"
                                items={[
                                    "Autonomous sales outreach agents",
                                    "AR/VR meeting integration",
                                    "Blockchain-based contract verification",
                                    "Marketplace for third-party plugins",
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

function RoadmapItem({
    quarter,
    status,
    title,
    items,
}: {
    quarter: string;
    status: "completed" | "in-progress" | "planned";
    title: string;
    items: string[];
}) {
    let Icon = Circle;
    let colorClass = "text-gray-500 border-gray-500 bg-[#0F0F1A]";
    let statusText = "Planned";

    if (status === "completed") {
        Icon = CheckCircle2;
        colorClass = "text-green-500 border-green-500 bg-[#0F0F1A]";
        statusText = "Completed";
    } else if (status === "in-progress") {
        Icon = Clock;
        colorClass = "text-primary border-primary bg-[#0F0F1A]";
        statusText = "In Progress";
    }

    return (
        <div className="relative md:grid md:grid-cols-5 md:gap-8 group">
            <div className="md:col-span-1 mb-4 md:mb-0 md:text-right">
                <div className={`absolute -left-[41px] md:left-auto md:-right-[43px] top-1 h-6 w-6 rounded-full border-2 flex items-center justify-center z-10 ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                </div>
                <p className="text-lg font-bold text-white">{quarter}</p>
                <span className={`text-xs font-mono uppercase tracking-wider px-2 py-1 rounded-full border ${status === 'completed' ? 'border-green-500/30 text-green-400 bg-green-500/10' : status === 'in-progress' ? 'border-primary/30 text-primary bg-primary/10' : 'border-gray-700 text-gray-400 bg-gray-800'}`}>
                    {statusText}
                </span>
            </div>
            <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-primary/30 transition-colors">
                <h3 className="text-2xl font-bold mb-6 group-hover:text-primary transition-colors">{title}</h3>
                <ul className="space-y-3">
                    {items.map((item, index) => (
                        <li key={index} className="flex items-start text-gray-300">
                            <span className="mr-3 mt-1.5 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                            {item}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
