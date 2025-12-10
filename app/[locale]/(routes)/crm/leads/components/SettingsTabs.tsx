"use client";

import React from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import CalendarIntegrationPanel from "./CalendarIntegrationPanel";
import CalendarAvailabilityPanel from "./CalendarAvailabilityPanel";
import CalendarEventsPanel from "./CalendarEventsPanel";
import SignaturesResourcesPanel from "./SignaturesResourcesPanel";

type SettingsTabsProps = {
    defaultTab?: "integration" | "availability" | "events" | "signatures";
};

export default function SettingsTabs({ defaultTab = "integration" }: SettingsTabsProps) {
    return (
        <div className="w-full h-full flex flex-col">
            <Tabs defaultValue={defaultTab} className="w-full h-full flex flex-col">
                <div className="flex items-center justify-start mb-4 flex-shrink-0 w-full overflow-hidden">
                    <div className="overflow-x-auto no-scrollbar w-full">
                        <TabsList className="inline-flex h-8 p-0.5 min-w-max">
                            <TabsTrigger value="integration" className="justify-center py-1 px-2 text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap">Integration</TabsTrigger>
                            <TabsTrigger value="availability" className="justify-center py-1 px-2 text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap">Availability</TabsTrigger>
                            <TabsTrigger value="events" className="justify-center py-1 px-2 text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap">Events</TabsTrigger>
                            <TabsTrigger value="signatures" className="justify-center py-1 px-2 text-[10px] uppercase tracking-wider font-semibold whitespace-nowrap">Signatures</TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                <TabsContent value="integration" className="overflow-auto flex-1">
                    <div className="space-y-6">
                        <CalendarIntegrationPanel />
                    </div>
                </TabsContent>

                <TabsContent value="availability" className="overflow-auto flex-1">
                    <div className="space-y-6">
                        <CalendarAvailabilityPanel />
                    </div>
                </TabsContent>

                <TabsContent value="events" className="overflow-auto flex-1">
                    <div className="space-y-6">
                        <CalendarEventsPanel />
                    </div>
                </TabsContent>

                <TabsContent value="signatures" className="overflow-auto flex-1">
                    <div className="space-y-6">
                        <SignaturesResourcesPanel />
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
