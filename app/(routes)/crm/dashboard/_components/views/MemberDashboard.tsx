"use client";

import { LeadsWidget, TasksWidget, CampaignsWidget, MessagesWidget } from "../widgets";
import DashboardCard from "../DashboardCard";
import { Folder, Zap, Sparkles } from "lucide-react";
import { useGreeting } from "@/app/hooks/use-greeting";

interface MemberDashboardProps {
    userId: string;
    userName?: string;
    dailyTasks: any[];
    newLeads: any[];
    newProjects: any[];
    messages: any[];
    userTasksCount: number;
}

const MemberDashboard = ({
    userId,
    userName,
    dailyTasks,
    newLeads,
    newProjects,
    messages,
    userTasksCount,
}: MemberDashboardProps) => {
    const greeting = useGreeting();

    return (
        <div className="flex flex-col space-y-10 p-4">
            {/* Hero / Focus Section */}
            <div>
                <div className="flex items-center gap-3 mb-2">
                    <Sparkles className="w-6 h-6 text-primary animate-pulse" />
                    <h2 className="text-3xl font-bold tracking-tight text-white/90">{greeting}{userName ? `, ${userName}` : ""}</h2>
                </div>
                <p className="text-muted-foreground mb-8 font-medium">Here is what's on your plate today.</p>

                {/* The Action Grid - Modern Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <LeadsWidget leads={newLeads} />
                    <TasksWidget tasks={dailyTasks} userId={userId} />
                    <CampaignsWidget projects={newProjects} />
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
