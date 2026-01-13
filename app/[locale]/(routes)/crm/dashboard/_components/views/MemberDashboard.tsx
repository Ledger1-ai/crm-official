"use client";

import React from "react";
import DashboardCard from "../DashboardCard";
import DailyTasksWidget from "../DailyTasksWidget";
import MyLeadsWidget from "../MyLeadsWidget";
import NewProjectsWidget from "../NewProjectsWidget";
import MessagesWidget from "../MessagesWidget";
import { Folder, Zap } from "lucide-react";

interface MemberDashboardProps {
    userId: string;
    dailyTasks: any[];
    newLeads: any[];
    newProjects: any[];
    messages: any[];
    userTasksCount: number;
}

const MemberDashboard = ({
    userId,
    dailyTasks,
    newLeads,
    newProjects,
    messages,
    userTasksCount,
}: MemberDashboardProps) => {
    return (
        <div className="flex flex-col space-y-8">
            {/* Hero / Focus Section */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight mb-4">Good Morning</h2>
                <p className="text-muted-foreground mb-8">Here is what's on your plate today.</p>

                {/* The Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Daily Tasks - Warning/Yellow Theme */}
                    <DailyTasksWidget tasks={dailyTasks} />

                    {/* New Leads - Info/Cyan Theme (mapped to UserPlus in widget) */}
                    <MyLeadsWidget leads={newLeads} />

                    {/* Projects - Default or Custom */}
                    <NewProjectsWidget projects={newProjects} />

                    {/* Messages - Default or Custom */}
                    <MessagesWidget messages={messages} />
                </div>
            </div>

            {/* Quick Stats Row (Personal Performance) */}
            <div>
                <h3 className="text-lg font-semibold mb-4">My Performance</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <DashboardCard
                        icon={Zap}
                        label="Total Active Tasks"
                        count={userTasksCount}
                        variant="violet"
                        description="Across all projects"
                        className="h-32"
                    />
                    <DashboardCard
                        icon={Folder}
                        label="Active Projects"
                        count={newProjects.length}
                        variant="default"
                        description="You are a member of"
                        className="h-32"
                    />
                    {/* Placeholder for future Stat */}
                    <div className="h-32 rounded-2xl border border-dashed flex items-center justify-center text-muted-foreground text-sm">
                        More stats coming soon
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MemberDashboard;
