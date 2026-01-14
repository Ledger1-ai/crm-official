"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardCard from "../DashboardCard";
import { DollarSign, TrendingUp, Users2, Activity, UserPlus, FolderPlus, ClipboardList, MessageSquare } from "lucide-react";
import { EntityBreakdown } from "../../../../dashboard/components/EntityBreakdown";
import JumpBackIn from "../JumpBackIn";

interface AdminDashboardProps {
    userId: string;
    userName: string;
    revenue: number;
    activePipelineCount: number;
    totalLeads: number;
    totalOpportunities: number;
    activeUsersCount: number;
    myPipeline: React.ReactNode;
    teamPipeline: React.ReactNode;
    crmEntities: any[];
    projectEntities: any[];
    // Quick Action Counts
    newLeadsCount: number;
    newProjectsCount: number;
    allTasksCount: number;
    messagesCount: number;
}

const AdminDashboard = ({
    userId,
    userName,
    revenue,
    activePipelineCount,
    totalLeads,
    totalOpportunities,
    activeUsersCount,
    myPipeline,
    teamPipeline,
    crmEntities = [],
    projectEntities = [],
    newLeadsCount = 0,
    newProjectsCount = 0,
    allTasksCount = 0,
    messagesCount = 0
}: AdminDashboardProps) => {
    const router = useRouter();

    return (
        <div className="flex flex-col space-y-8 p-4">
            {/* 1. Header & Quick Actions (Pills) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white/90">Good morning, {userName}</h1>
                    <p className="text-muted-foreground mt-1">This is your Command Center.</p>
                </div>

                {/* The "Pills" */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-3 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-lg text-indigo-300">
                        <UserPlus className="w-4 h-4" />
                        <span className="text-sm font-medium">New Leads</span>
                        <span className="ml-auto bg-indigo-500/20 px-2 py-0.5 rounded text-xs font-bold">{newLeadsCount}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-4 py-2 rounded-lg text-amber-300">
                        <FolderPlus className="w-4 h-4" />
                        <span className="text-sm font-medium">New Projects</span>
                        <span className="ml-auto bg-amber-500/20 px-2 py-0.5 rounded text-xs font-bold">{newProjectsCount}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-lg text-emerald-300">
                        <ClipboardList className="w-4 h-4" />
                        <span className="text-sm font-medium">All Tasks</span>
                        <span className="ml-auto bg-emerald-500/20 px-2 py-0.5 rounded text-xs font-bold">{allTasksCount}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/20 px-4 py-2 rounded-lg text-cyan-300">
                        <MessageSquare className="w-4 h-4" />
                        <span className="text-sm font-medium">Messages</span>
                        <span className="ml-auto bg-cyan-500/20 px-2 py-0.5 rounded text-xs font-bold">{messagesCount}</span>
                    </div>
                </div>
            </div>

            {/* 2. The Main Grid ("Big Buttons") */}
            {/* Breadcrumbs Row + Total Records */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-2">
                <JumpBackIn />

                {/* Lifted Total Records Count */}
                {crmEntities.length > 0 && (
                    <div className="flex items-center gap-2 pb-1">
                        <span className="text-2xl font-bold text-white">
                            {crmEntities.reduce((sum, e) => sum + e.value, 0)}
                        </span>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                            Total Records
                        </span>
                    </div>
                )}
            </div>

            <div className="grid gap-6 grid-cols-1">
                {crmEntities.length > 0 && (
                    <EntityBreakdown title="" entities={crmEntities} hideHeader={true} className="border-none bg-transparent p-0 shadow-none" />
                )}
                {/* Merging Projects into the same visual flow if possible, or stacked */}

            </div>


            {/* 3. Deep Dive Stats (Legacy Command Center) - Kept below as secondary info */}
            <div className="pt-8 border-t border-white/10">
                <h3 className="text-lg font-semibold text-white/80 mb-6">Performance Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <DashboardCard
                        icon={DollarSign}
                        label="Expected Revenue"
                        count={revenue.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 })}
                        description="From open opportunities"
                        variant="success"
                        hideIcon={true}
                        onClick={() => router.push("/crm/opportunities")}
                        className="cursor-pointer hover:ring-1 hover:ring-emerald-500/50"
                    />
                    <DashboardCard
                        icon={TrendingUp}
                        label="Active Pipeline"
                        count={activePipelineCount}
                        description={`${totalLeads} Leads, ${totalOpportunities} Opportunities`}
                        variant="info"
                        onClick={() => router.push("/crm/opportunities")}
                        className="cursor-pointer hover:ring-1 hover:ring-cyan-500/50"
                    />
                    <DashboardCard
                        icon={Users2}
                        label="Active Users"
                        count={activeUsersCount}
                        description="Team members active"
                        variant="violet"
                        onClick={() => router.push("/settings/team")}
                        className="cursor-pointer hover:ring-1 hover:ring-violet-500/50"
                    />
                    <DashboardCard
                        icon={Activity}
                        label="System Health"
                        count="98%"
                        description="Operational"
                        variant="warning"
                        onClick={() => router.push("/partners/plans")}
                        className="cursor-pointer hover:ring-1 hover:ring-amber-500/50"
                    />
                </div>
            </div>

            {/* 4. Pipeline Visualizations (Slots) */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                {myPipeline}
                {teamPipeline}
            </div>
        </div >
    );
};

export default AdminDashboard;
