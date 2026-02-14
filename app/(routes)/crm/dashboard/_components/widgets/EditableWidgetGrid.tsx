"use client";

import React, { useState } from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragEndEvent,
    DragStartEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useDashboardLayout } from "../../_context/DashboardLayoutContext";
import { SortableWidget } from "./SortableWidget";
import { Plus, X, Info } from "lucide-react";
import { EntityBreakdown } from "../../../../dashboard/components/EntityBreakdown";
import DashboardCard from "../DashboardCard";
import {
    LeadsWidget,
    TasksWidget,
    ProjectsWidget,
    MessagesWidget,
    TeamActivityWidget,
    RecentFilesWidget,
    RevenuePacingWidget,
    RevenueWidget,
    ActivePipelineWidget,
    ActiveUsersWidget,
    SystemHealthWidget,
    MyScheduleWidget,
    OutreachROIWidget,
    LeadPoolsWidget,
    LeadWizardWidget,
    AIInsightsWidget,
    RevenueWidget as GenericStatsWidget
} from "../widgets";
import {
    Users,
    Zap,
    Target,
    BarChart3,
    Calendar,
    MessageCircle,
    ArrowUpRight,
    Timer,
    CloudLightning,
    Heart
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { motion } from "framer-motion";

// Widget tooltip descriptions
const widgetTooltips: Record<string, string> = {
    revenue: "Your total expected revenue from open opportunities. Click to view your full opportunity pipeline.",
    active_pipeline: "Number of active deals currently in your sales pipeline. Shows leads and opportunities at a glance.",
    active_users: "Total team members currently active in the system. Click to manage your team settings.",
    system_health: "Real-time system operational status. Monitors uptime and platform performance.",
    conversion_rate: "Percentage of leads converting to deals over the last 30 days. Track how effectively you close.",
    avg_deal_size: "Average value of your active deals. Helps gauge deal quality and pipeline health.",
    response_time: "Average time to respond to leads and inquiries. Faster responses improve close rates.",
    system_uptime: "Platform availability percentage. Green means all systems are running smoothly.",
    my_schedule: "Your upcoming meetings and scheduled events. Click to open your calendar.",
    opportunity_forecast: "Revenue forecast based on pipeline probability and deal stages.",
    customer_pulse: "Overall customer satisfaction based on recent interactions and feedback.",
    campaign_performance: "Return on investment for your active campaigns and marketing spend.",
    upcoming_meetings: "Today's scheduled meetings and upcoming appointments.",
    collaboration_feed: "Recent mentions and activity in project threads you're part of.",
    leads: "Newest leads added to your pipeline. Review and assign them quickly.",
    tasks: "Your daily task list. Stay productive and on track with your priorities.",
    projects: "Recently created or updated projects. Jump straight into project work.",
    messages: "Your latest messages and notifications. Stay in the loop with your team.",
    team_activity: "Recent actions taken by team members across the CRM.",
    recent_files: "Files recently uploaded or modified. Quick access to your documents.",
    revenue_pacing: "Track how your revenue is trending against monthly targets.",
    outreach_roi: "Return on investment from your outreach campaigns and sequences.",
    lead_pools: "Overview of your lead pool segments and their current status.",
    lead_wizard: "AI-powered lead discovery stats. See how many matches have been found.",
    ai_insights: "Smart suggestions from AI to optimize your workflows and close more deals.",
    personal_pipeline: "Your personal deals and pipeline progress. Focus on what matters to you.",
    team_pipeline: "Full team pipeline overview. Monitor overall team sales performance.",
};

// Mobile info button for widgets
function WidgetInfoButton({ tooltip, widgetName }: { tooltip: string; widgetName: string }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsOpen(true);
                }}
                className="md:hidden absolute top-2 right-2 z-30 w-5 h-5 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200"
                aria-label={`Info about ${widgetName}`}
            >
                <Info className="w-3 h-3" />
            </button>

            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 z-[100] flex items-end justify-center"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsOpen(false);
                    }}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="relative z-10 w-full max-w-sm mx-4 mb-8 rounded-2xl border border-white/15 bg-[#18181b]/95 backdrop-blur-xl p-5 shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                                <Info className="w-4 h-4 text-primary" />
                            </div>
                            <h4 className="text-sm font-bold text-white tracking-wide uppercase">{widgetName}</h4>
                        </div>
                        <p className="text-[13px] leading-relaxed text-white/75">{tooltip}</p>
                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="mt-4 w-full py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-xs font-medium transition-colors"
                        >
                            Got it
                        </button>
                    </motion.div>
                </div>
            )}
        </>
    );
}

// Wraps a widget with a desktop tooltip and mobile info button
function WidgetWithTooltip({ id, children }: { id: string; children: React.ReactNode }) {
    const tooltip = widgetTooltips[id];
    if (!tooltip) return <>{children}</>;

    // Get a display name from the ID
    const displayName = id.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    return (
        <div className="relative">
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="w-full h-full">
                        {children}
                    </div>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    className="hidden md:block max-w-[260px] rounded-xl border border-white/15 bg-[#18181b]/95 backdrop-blur-xl px-4 py-3 shadow-2xl"
                >
                    <p className="text-[12px] leading-relaxed text-white/80 font-medium">{tooltip}</p>
                </TooltipContent>
            </Tooltip>
            <WidgetInfoButton tooltip={tooltip} widgetName={displayName} />
        </div>
    );
}

interface EditableWidgetGridProps {
    newLeads: any[];
    dailyTasks: any[];
    userId: string;
    newProjects: any[];
    messages: any[];
    teamActivity?: any[];
    recentFiles?: any[];
    revenuePacing?: any;
    outreachStats?: any;
    leadPools?: any[];
    leadGenStats?: any;
    intelligenceStats?: any;
    aiInsights?: any[];
    // Stats Props
    revenue?: number;
    activePipelineCount?: number;
    totalLeads?: number;
    totalOpportunities?: number;
    activeUsersCount?: number;
    myPipeline?: React.ReactNode;
    teamPipeline?: React.ReactNode;
    crmEntities?: any[];
}

export const EditableWidgetGrid = ({
    newLeads,
    dailyTasks,
    userId,
    newProjects,
    messages,
    teamActivity = [],
    recentFiles = [],
    revenuePacing = null,
    outreachStats = null,
    leadPools = [],
    leadGenStats = null,
    intelligenceStats = null,
    aiInsights = [],
    revenue = 0,
    activePipelineCount = 0,
    totalLeads = 0,
    totalOpportunities = 0,
    activeUsersCount = 0,
    myPipeline,
    teamPipeline,
    crmEntities = []
}: EditableWidgetGridProps) => {
    const { widgets, updateLayout, isEditMode, toggleWidgetVisibility } = useDashboardLayout();
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = widgets.findIndex((w) => w.id === active.id);
            const newIndex = widgets.findIndex((w) => w.id === over.id);
            updateLayout(arrayMove(widgets, oldIndex, newIndex));
        }

        setActiveId(null);
    };

    const getWidgetSpanClass = (id: string) => {
        if (id.startsWith("divider")) return "col-span-1 md:col-span-2 xl:col-span-4";
        switch (id) {
            case "crm_entities_grid":
                return "col-span-1 md:col-span-2 xl:col-span-4";
            case "personal_pipeline":
            case "team_pipeline":
            case "team_activity":
            case "recent_files":
            case "revenue_pacing":
            case "outreach_roi":
            case "lead_pools":
            case "lead_wizard":
            case "ai_insights":
                return "col-span-1 md:col-span-2 xl:col-span-2";
            default:
                return "col-span-1";
        }
    };

    // Mapping ID to Component
    const renderWidget = (id: string) => {
        if (id.startsWith("divider")) {
            return (
                <div className="py-3 w-full">
                    <div className="h-px w-full bg-white/10" />
                </div>
            );
        }
        switch (id) {
            case "leads":
                return <LeadsWidget leads={newLeads} />;
            case "tasks":
                return <TasksWidget tasks={dailyTasks} userId={userId} />;
            case "projects":
                return <ProjectsWidget projects={newProjects} />;
            case "messages":
                return <MessagesWidget messages={messages} />;
            case "team_activity":
                return <TeamActivityWidget activity={teamActivity} />;
            case "recent_files":
                return <RecentFilesWidget files={recentFiles} />;
            case "revenue_pacing":
                return (
                    <RevenuePacingWidget
                        currentRevenue={revenuePacing?.currentRevenue || 0}
                        targetRevenue={revenuePacing?.targetRevenue || 0}
                        projectedEOM={revenuePacing?.projectedEOM || 0}
                        daysLeft={revenuePacing?.daysRemaining || 0}
                    />
                );
            case "outreach_roi":
                return <OutreachROIWidget data={outreachStats} />;
            case "lead_pools":
                return <LeadPoolsWidget pools={leadPools} />;
            case "lead_wizard":
                return <LeadWizardWidget data={leadGenStats} />;
            case "ai_insights":
                return <AIInsightsWidget insights={aiInsights} />;
            case "revenue":
                return (
                    <div className="h-full flex flex-col justify-start">
                        <RevenueWidget revenue={revenue} />
                    </div>
                );
            case "active_pipeline":
                return (
                    <div className="h-full flex flex-col justify-start">
                        <ActivePipelineWidget count={activePipelineCount} description={`${totalLeads} Leads, ${totalOpportunities} Opportunities`} />
                    </div>
                );
            case "active_users":
                return (
                    <div className="h-full flex flex-col justify-start">
                        <ActiveUsersWidget count={activeUsersCount} />
                    </div>
                );
            case "system_health":
                return (
                    <div className="h-full flex flex-col justify-start">
                        <SystemHealthWidget />
                    </div>
                );
            case "crm_entities_grid":
                return (
                    <div className="w-full">
                        <EntityBreakdown
                            title=""
                            entities={crmEntities}
                            hideHeader={true}
                            className="border-none bg-transparent p-0 shadow-none"
                        />
                    </div>
                );
            case "my_schedule":
                return (
                    <div className="h-full flex flex-col justify-start">
                        <MyScheduleWidget />
                    </div>
                );
            case "opportunity_forecast":
                return (
                    <GenericStatsWidget
                        revenue={revenue * 1.2}
                    />
                );
            case "customer_pulse":
                return (
                    <DashboardCard
                        icon={Heart}
                        label="Customer Pulse"
                        count="Good"
                        description="Based on 124 interactions"
                        variant="success"
                    />
                );
            case "campaign_performance":
                return (
                    <DashboardCard
                        icon={BarChart3}
                        label="Campaign ROI"
                        count="3.2x"
                        description="Overall return on spend"
                        variant="info"
                    />
                );
            case "ai_insights":
                return (
                    <DashboardCard
                        icon={Zap}
                        label="AI Command"
                        count="4 Suggestions"
                        description="Workflow optimizations found"
                        variant="violet"
                    />
                );
            case "upcoming_meetings":
                return (
                    <DashboardCard
                        icon={Calendar}
                        label="Meetings"
                        count="3 Today"
                        description="Next: Lead Sync @ 2PM"
                        variant="default"
                    />
                );
            case "collaboration_feed":
                return (
                    <DashboardCard
                        icon={MessageCircle}
                        label="Collaboration"
                        count="12 Mentions"
                        description="Active project threads"
                        variant="info"
                    />
                );
            case "conversion_rate":
                return <DashboardCard icon={ArrowUpRight} label="Conv. Rate" count={`${intelligenceStats?.conversionRate || 0}%`} description="Last 30 days" variant="success" />;
            case "avg_deal_size":
                return <DashboardCard icon={Target} label="Avg Deal" count={`$${(intelligenceStats?.avgDealSize || 0).toLocaleString()}`} description="Active deals" variant="info" />;
            case "response_time":
                return <DashboardCard icon={Timer} label="Resp. Time" count={`${intelligenceStats?.responseTime || 1.2}h`} description="Goal: < 2.0h" variant="warning" />;
            case "system_uptime":
                return <DashboardCard icon={CloudLightning} label="Uptime" count="99.99%" description="All systems green" variant="success" />;

            case "personal_pipeline":
                return (
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] pl-1">Personal Pipeline</h4>
                        {myPipeline}
                    </div>
                );
            case "team_pipeline":
                return (
                    <div className="space-y-4">
                        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em] pl-1">Team Overview</h4>
                        {teamPipeline}
                    </div>
                );
            default:
                return null;
        }
    };

    // Filter out entity widgets from this grid's management
    const operationalWidgets = widgets.filter(w => !w.id.startsWith("entity:"));

    const itemsToRender = isEditMode
        ? operationalWidgets
        : operationalWidgets.filter(w => w.isVisible);

    const sortableItems = itemsToRender.map(w => w.id);
    const hiddenOperationalWidgets = operationalWidgets.filter(w => !w.isVisible);

    if (itemsToRender.length === 0 && !isEditMode) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-white/10 rounded-xl bg-white/5 text-center">
                <p className="text-white/60 text-sm font-medium mb-2">No widgets visible</p>
                <p className="text-muted-foreground text-xs">Click the settings icon above to customize your dashboard.</p>
            </div>
        );
    }

    return (
        <TooltipProvider delayDuration={300}>
            <div className="space-y-8">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                            {itemsToRender.map((widget) => (
                                <SortableWidget
                                    key={widget.id}
                                    id={widget.id}
                                    disabled={!isEditMode}
                                    className={getWidgetSpanClass(widget.id)}
                                >
                                    <WidgetWithTooltip id={widget.id}>
                                        {renderWidget(widget.id)}
                                    </WidgetWithTooltip>
                                </SortableWidget>
                            ))}
                        </div>
                    </SortableContext>

                    <DragOverlay>
                        {activeId ? (
                            <div className="opacity-80">
                                {renderWidget(activeId)}
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>

                {/* Hidden Widgets Palette - Only in Edit Mode */}
                {isEditMode && hiddenOperationalWidgets.length > 0 && (
                    <div className="border-t border-white/10 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Plus size={14} /> Available Operation Widgets
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 opacity-60 hover:opacity-100 transition-opacity">
                            {hiddenOperationalWidgets.map((widget) => (
                                <div
                                    key={widget.id}
                                    className="relative group cursor-pointer border border-dashed border-white/20 rounded-xl p-4 hover:bg-white/5 hover:border-emerald-500/50 transition-all font-sans"
                                    onClick={() => toggleWidgetVisibility(widget.id, true)}
                                >
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-emerald-500 text-white rounded-full p-1">
                                        <Plus size={12} />
                                    </div>
                                    <div className="pointer-events-none scale-[0.85] origin-top-left overflow-hidden">
                                        {renderWidget(widget.id)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
};
