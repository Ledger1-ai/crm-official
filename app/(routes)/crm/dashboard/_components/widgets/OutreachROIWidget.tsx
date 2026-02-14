"use client";

import React from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { Megaphone, Mail, Calendar, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface OutreachROIWidgetProps {
    data: {
        aggregate: {
            emails_sent: number;
            emails_opened: number;
            meetings_booked: number;
            total_leads: number;
        };
        openRate: number;
        bookingRate: number;
        campaigns: any[];
    } | null;
}

export const OutreachROIWidget = ({ data }: OutreachROIWidgetProps) => {
    if (!data) {
        return (
            <WidgetWrapper title="Outreach ROI" icon={Megaphone} iconColor="text-orange-400">
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/30">
                    <Megaphone className="h-10 w-10 mb-2 opacity-10" />
                    <p className="text-[11px] font-medium italic">No active campaigns</p>
                </div>
            </WidgetWrapper>
        );
    }

    return (
        <WidgetWrapper
            title="Outreach ROI"
            icon={Megaphone}
            iconColor="text-orange-400"
            footerHref="/crm/outreach"
            footerLabel="Manage Campaigns"
        >
            <div className="space-y-6 pt-2">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Open Rate</span>
                        </div>
                        <div className="text-xl font-bold text-white">
                            {data.openRate.toFixed(1)}%
                        </div>
                        <Progress value={data.openRate} className="h-1 bg-white/5" indicatorClassName="bg-orange-500" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Calendar size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Bookings</span>
                        </div>
                        <div className="text-xl font-bold text-white">
                            {data.aggregate.meetings_booked}
                        </div>
                        <Progress value={(data.bookingRate * 5)} className="h-1 bg-white/5" indicatorClassName="bg-emerald-500" />
                    </div>
                </div>

                {/* Campaign List */}
                <div className="space-y-3 border-t border-white/5 pt-4">
                    <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Top Performing</h4>
                    {data.campaigns.map((c, i) => (
                        <div key={i} className="flex items-center justify-between group">
                            <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold text-white/90 truncate group-hover:text-orange-400 transition-colors">
                                    {c.name}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {c.emails_sent} sent • {c.meetings_booked} booked
                                </p>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                                <TrendingUp size={10} />
                                {c.emails_sent > 0 ? ((c.emails_opened / c.emails_sent) * 100).toFixed(0) : 0}%
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </WidgetWrapper>
    );
};
