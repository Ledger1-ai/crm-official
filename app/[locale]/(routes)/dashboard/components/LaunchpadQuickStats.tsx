"use client";

import React from "react";
import { TrendingUp, Zap } from "lucide-react";
import DashboardCard from "../../crm/dashboard/_components/DashboardCard";

interface LaunchpadQuickStatsProps {
    activePipelineCount: number;
    activePipelineDescription: string;
    userTasksCount: number;
    totalTasksCount: number;
}

export const LaunchpadQuickStats = ({
    activePipelineCount,
    activePipelineDescription,
    userTasksCount,
    totalTasksCount,
}: LaunchpadQuickStatsProps) => {
    return (
        <>
            <DashboardCard
                icon={TrendingUp}
                label="Active Pipeline"
                count={activePipelineCount}
                description={activePipelineDescription}
                variant="info"
                className="h-full"
            />
            <DashboardCard
                icon={Zap}
                label="My Pending Tasks"
                count={userTasksCount}
                description={`of ${totalTasksCount} total tasks`}
                variant="warning"
                className="h-full"
            />
        </>
    );
};
