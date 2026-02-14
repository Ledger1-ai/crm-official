"use client";

import React, { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Plus, Layout, Grid3X3, Check } from "lucide-react";
import { useDashboardLayout, WidgetItem } from "../../_context/DashboardLayoutContext";
import { cn } from "@/lib/utils";

interface WidgetGalleryProps {
    availableEntities: any[];
}

export const WidgetGallery = ({ availableEntities }: WidgetGalleryProps) => {
    const { widgets, toggleWidgetVisibility } = useDashboardLayout();
    const [open, setOpen] = useState(false);

    const hiddenWidgets = widgets.filter((w) => !w.isVisible);

    // Categories
    const bigWidgets = hiddenWidgets.filter((w) => !w.id.startsWith("entity:"));
    const entityWidgets = hiddenWidgets.filter((w) => w.id.startsWith("entity:"));

    const getWidgetLabel = (id: string) => {
        if (id.startsWith("entity:")) {
            const entity = availableEntities.find(e => e.id === id);
            return entity?.name || id.replace("entity:", "").replace("_", " ");
        }
        if (id === "crm_entities_grid") return "CRM Quick Access Grid";
        if (id === "personal_pipeline") return "Personal Sales Pipeline";
        if (id === "team_pipeline") return "Team Sales Overview";
        if (id === "opportunity_forecast") return "AI Revenue Forecast";
        if (id === "customer_pulse") return "Customer Pulse Analytics";
        if (id === "campaign_performance") return "Campaign ROI Monitor";
        if (id === "ai_insights") return "Intelligence Assistant";
        if (id === "upcoming_meetings") return "Today's Schedule";
        if (id === "collaboration_feed") return "Team Collaboration";
        if (id === "conversion_rate") return "Lead Conversion Rate";
        if (id === "avg_deal_size") return "Average Deal Size";
        if (id === "response_time") return "Avg Response Time";
        if (id === "system_uptime") return "Infrastructure Health";
        return id.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
    };

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white/5 border-white/10 hover:bg-white/10 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Widget
                </Button>
            </SheetTrigger>
            <SheetContent className="bg-[#0a0a0a] border-white/10 text-white w-[400px] sm:w-[540px]">
                <SheetHeader>
                    <SheetTitle className="text-white">Widget Gallery</SheetTitle>
                    <SheetDescription className="text-white/60">
                        Add intelligence widgets and quick access icons to your dashboard.
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-8 space-y-8 overflow-y-auto max-h-[calc(100vh-200px)] pr-2 custom-scrollbar">
                    {/* Big Widgets */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Layout className="w-4 h-4 text-primary" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">Operation Widgets</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {bigWidgets.length > 0 ? (
                                bigWidgets.map((widget) => (
                                    <div
                                        key={widget.id}
                                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all group"
                                    >
                                        <div>
                                            <p className="font-medium text-white">{getWidgetLabel(widget.id)}</p>
                                            <p className="text-xs text-white/40 capitalize">{widget.id.replace("_", " ")} Display</p>
                                        </div>
                                        <Button
                                            size="sm"
                                            onClick={() => toggleWidgetVisibility(widget.id, true)}
                                            className="bg-primary/20 hover:bg-primary text-primary hover:text-white transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-white/20 italic">No operation widgets hidden.</p>
                            )}
                        </div>
                    </div>

                    {/* Entity Icons */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Grid3X3 className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/40">Quick Access Icons</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {entityWidgets.length > 0 ? (
                                entityWidgets.map((widget) => (
                                    <div
                                        key={widget.id}
                                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-all group"
                                    >
                                        <span className="text-sm font-medium text-white/80">{getWidgetLabel(widget.id)}</span>
                                        <button
                                            onClick={() => toggleWidgetVisibility(widget.id, true)}
                                            className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-xs text-white/20 italic col-span-2">All quick access icons are on your dashboard.</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-8 left-6 right-6">
                    <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        onClick={() => setOpen(false)}
                    >
                        <Check className="w-4 h-4 mr-2" />
                        Done Personalizing
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
};
