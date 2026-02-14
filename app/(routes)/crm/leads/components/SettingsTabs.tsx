"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CalendarIntegrationPanel from "./CalendarIntegrationPanel";
import CalendarAvailabilityPanel from "./CalendarAvailabilityPanel";
import CalendarEventsPanel from "./CalendarEventsPanel";
import SignaturesResourcesPanel from "./SignaturesResourcesPanel";
import PortalSettingsPanel from "./PortalSettingsPanel";
import { Link, Clock, Calendar, PenTool, MessageSquare, LucideIcon } from "lucide-react";
import DashboardCard from "../../dashboard/_components/DashboardCard";

type SettingsTabsProps = {
    defaultTab?: "integration" | "availability" | "events" | "signatures" | "portal";
};

type CardItem = {
    value: string;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    iconColor: string;
};

export default function SettingsTabs({ defaultTab = "integration" }: SettingsTabsProps) {
    const cards: CardItem[] = [
        {
            value: "integration",
            title: "Integration",
            description: "Connect your calendar",
            icon: Link,
            color: "from-blue-500/20 to-cyan-500/20",
            iconColor: "text-blue-400"
        },
        {
            value: "availability",
            title: "Availability",
            description: "Set your working hours",
            icon: Clock,
            color: "from-emerald-500/20 to-green-500/20",
            iconColor: "text-emerald-400"
        },
        {
            value: "events",
            title: "Events",
            description: "Manage event types",
            icon: Calendar,
            color: "from-violet-500/20 to-purple-500/20",
            iconColor: "text-violet-400"
        },
        {
            value: "signatures",
            title: "Resources",
            description: "Manage buttons & prompts",
            icon: PenTool,
            color: "from-orange-500/20 to-amber-500/20",
            iconColor: "text-orange-400"
        },
        {
            value: "portal",
            title: "SMS Portal",
            description: "Messaging settings",
            icon: MessageSquare,
            color: "from-pink-500/20 to-rose-500/20",
            iconColor: "text-pink-400"
        }
    ];

    return (
        <div className="w-full h-full flex flex-col">
            <Tabs defaultValue={defaultTab} className="w-full h-full flex flex-col">
                <TabsList className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-4 h-auto bg-transparent p-0">
                    {cards.map((card) => {
                        let variant: "info" | "violet" | "warning" | "success" | "default" = "default";
                        if (card.value === "integration") variant = "info";
                        if (card.value === "availability") variant = "success";
                        if (card.value === "events") variant = "violet";
                        if (card.value === "signatures") variant = "warning";
                        if (card.value === "portal") variant = "violet";

                        return (
                            <TabsTrigger
                                key={card.value}
                                value={card.value}
                                asChild
                            >
                                <DashboardCard
                                    icon={card.icon}
                                    label={card.title}
                                    description={card.description}
                                    variant={variant}
                                    hideIcon={true}
                                    className="data-[state=active]:ring-2 data-[state=active]:ring-primary data-[state=active]:border-primary/50"
                                    labelClassName="text-sm md:text-base"
                                    descriptionClassName="text-[10px] md:text-xs"
                                />
                            </TabsTrigger>
                        );
                    })}
                </TabsList>

                <TabsContent value="integration" className="mt-0">
                    <div className="space-y-6">
                        <CalendarIntegrationPanel />
                    </div>
                </TabsContent>

                <TabsContent value="availability" className="mt-0">
                    <div className="space-y-6">
                        <CalendarAvailabilityPanel />
                    </div>
                </TabsContent>

                <TabsContent value="events" className="mt-0">
                    <div className="space-y-6">
                        <CalendarEventsPanel />
                    </div>
                </TabsContent>

                <TabsContent value="signatures" className="mt-0">
                    <div className="space-y-6">
                        <SignaturesResourcesPanel />
                    </div>
                </TabsContent>

                <TabsContent value="portal" className="mt-0">
                    <div className="space-y-6">
                        <PortalSettingsPanel />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
