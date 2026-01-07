"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CalendarIntegrationPanel from "./CalendarIntegrationPanel";
import CalendarAvailabilityPanel from "./CalendarAvailabilityPanel";
import CalendarEventsPanel from "./CalendarEventsPanel";
import SignaturesResourcesPanel from "./SignaturesResourcesPanel";
import PortalSettingsPanel from "./PortalSettingsPanel";
import { Link, Clock, Calendar, PenTool, MessageSquare, LucideIcon } from "lucide-react";

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
            title: "Signatures",
            description: "Email signatures",
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
                <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4 h-auto bg-transparent p-0">
                    {cards.map((card) => (
                        <TabsTrigger
                            key={card.value}
                            value={card.value}
                            className={`
                                group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 
                                p-3 hover:bg-white/10 transition-all duration-300 backdrop-blur-md 
                                data-[state=active]:bg-white/10 data-[state=active]:shadow-lg data-[state=active]:ring-1 data-[state=active]:ring-white/20
                                h-full w-full justify-start text-left
                            `}
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-100 transition-opacity duration-300`} />

                            <div className="relative z-10 flex flex-col items-center justify-center space-y-2 text-center w-full">
                                <div className={`p-2 rounded-full bg-gradient-to-br ${card.color} border border-white/10 shadow-sm ${card.iconColor}`}>
                                    <card.icon className="w-5 h-5" strokeWidth={1.5} />
                                </div>
                                <div className="space-y-0.5">
                                    <span className="block text-xs md:text-sm font-medium text-foreground group-hover:text-white transition-colors">
                                        {card.title}
                                    </span>
                                    <span className="block text-[9px] md:text-[10px] text-muted-foreground group-hover:text-white/80 transition-colors hidden md:block">
                                        {card.description}
                                    </span>
                                </div>
                            </div>
                        </TabsTrigger>
                    ))}
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
