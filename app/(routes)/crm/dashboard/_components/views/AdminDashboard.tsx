"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useGreeting } from "@/app/hooks/use-greeting";
import DashboardCard from "../DashboardCard";
import { DollarSign, TrendingUp, Users2, Activity, UserPlus, FolderPlus, ClipboardList, MessageSquare } from "lucide-react";
import { EntityBreakdown } from "../../../../dashboard/components/EntityBreakdown";
import JumpBackIn from "../JumpBackIn";
import { DashboardLayoutProvider } from "../../_context/DashboardLayoutContext";
import { EditableWidgetGrid } from "../widgets/EditableWidgetGrid";
import { EditDashboardButton } from "../EditDashboardButton";

interface AdminDashboardProps {
    userId: string;
    userName: string;
    revenue: number;
    actualRevenue: number;
    activePipelineCount: number;
    totalLeads: number;
    totalOpportunities: number;
    activeUsersCount: number;
    myPipeline: React.ReactNode;
    teamPipeline: React.ReactNode;
    crmEntities: any[];
    projectEntities: any[];
    // Full Data for Widgets
    newLeads: any[];
    newProjects: any[];
    dailyTasks: any[];
    messages: any[];
    teamActivity: any[];
    recentFiles: any[];
    revenuePacing: any;
    outreachStats: any;
    leadPools: any[];
    leadGenStats: any;
    intelligenceStats: any;
    aiInsights: any[];
    // Quick Action Counts
    newLeadsCount: number;
    newProjectsCount: number;
    allTasksCount: number;
    messagesCount: number;
    initialLayout?: any[];
}

const AdminDashboard = ({
    userId,
    userName,
    revenue,
    actualRevenue,
    activePipelineCount,
    totalLeads,
    totalOpportunities,
    activeUsersCount,
    myPipeline,
    teamPipeline,
    crmEntities = [],
    projectEntities = [],
    newLeads = [],
    newProjects = [],
    dailyTasks = [],
    messages = [],
    teamActivity = [],
    recentFiles = [],
    revenuePacing = null,
    outreachStats = null,
    leadPools = [],
    leadGenStats = null,
    intelligenceStats = null,
    aiInsights = [],
    newLeadsCount = 0,
    newProjectsCount = 0,
    allTasksCount = 0,
    messagesCount = 0,
    initialLayout
}: AdminDashboardProps) => {
    const router = useRouter();
    const greeting = useGreeting();

    return (
        <DashboardLayoutProvider initialLayout={initialLayout}>
            <div className="flex flex-col p-6 min-h-screen">
                {/* 1. Header & Intelligence Section */}
                <div className="max-w-[1600px] mx-auto w-full space-y-8 pb-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white/90">{greeting}, {userName}</h1>
                            <p className="text-muted-foreground mt-1 font-medium italic opacity-80 border-l-2 border-primary/30 pl-3">This is your Command Center.</p>
                        </div>
                        {/* Jump Back In - Top Right with Global Edit */}
                        <div className="flex-shrink-0 relative">
                            <div className="absolute top-[-2.5rem] right-0 z-10 font-sans">
                                <EditDashboardButton availableEntities={crmEntities} />
                            </div>
                            <JumpBackIn align="right" userId={userId} />
                        </div>
                    </div>

                    {/* Intelligence & Operations Widgets - MOVED TO TOP */}
                    <EditableWidgetGrid
                        newLeads={newLeads}
                        dailyTasks={dailyTasks}
                        userId={userId}
                        newProjects={newProjects}
                        messages={messages}
                        teamActivity={teamActivity}
                        recentFiles={recentFiles}
                        revenuePacing={revenuePacing}
                        outreachStats={outreachStats}
                        leadPools={leadPools}
                        leadGenStats={leadGenStats}
                        intelligenceStats={intelligenceStats}
                        aiInsights={aiInsights}
                        revenue={revenue}
                        actualRevenue={actualRevenue}
                        activeUsersCount={activeUsersCount}
                        myPipeline={myPipeline}
                        teamPipeline={teamPipeline}
                        crmEntities={crmEntities}
                    />
                </div>
            </div>
        </DashboardLayoutProvider>
    );
};

export default AdminDashboard;
