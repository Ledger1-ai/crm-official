import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import AdminDashboard from "./views/AdminDashboard";
import MemberDashboard from "./views/MemberDashboard";
import ViewerDashboard from "./views/ViewerDashboard";

// Data Fetching Actions
import { getDailyTasks } from "@/actions/dashboard/get-daily-tasks";
import { getNewLeads } from "@/actions/dashboard/get-new-leads";
import { getNewProjects } from "@/actions/dashboard/get-new-projects";
import { getUserMessages } from "@/actions/dashboard/get-user-messages";
import { getUnifiedSalesData } from "@/actions/crm/get-unified-sales-data";
import { getUsersTasksCount } from "@/actions/dashboard/get-tasks-count";
import { getSummaryCounts } from "@/actions/dashboard/get-summary-counts";
import { getModules } from "@/actions/get-modules";

import { Suspense } from "react";
import MyPipelineSection from "../../../dashboard/components/MyPipelineSection";
import TeamPipelineSection from "../../../dashboard/components/TeamPipelineSection";
import LoadingBox from "../../../dashboard/components/loading-box";

const DashboardRoleManager = async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const userId = session.user.id;

    // 1. Determine Role
    const user = await prismadb.users.findUnique({
        where: { id: userId },
        select: { team_role: true, email: true, is_admin: true } // Email might be needed for hardcoded super admins if any
    });

    const role = (user?.team_role || "VIEWER").trim().toUpperCase();

    // Platform Admin Check: Only specific team/users if requirement exists, otherwise maps to PLATFORM_ADMIN role
    // For now, treating PLATFORM_ADMIN and ADMIN similarly but with potential future separation.
    const isAdmin = (user as any)?.is_admin || role === "PLATFORM_ADMIN" || role === "ADMIN" || role === "SUPER_ADMIN" || role === "PLATFORM ADMIN" || role === "SYSADM" || role === "OWNER";
    const isMember = role === "MEMBER";

    // 2. Fetch Data Parallel
    // We fetch different data based on role to optimize performance
    // 2. Fetch Data Parallel
    // We fetch different data based on role to optimize performance
    if (isAdmin) {
        const [unifiedData, activeUsersCount, counts, modules, usersTasks, newLeads, newProjects, dailyTasks, messages] = await Promise.all([
            getUnifiedSalesData(),
            prismadb.users.count(),
            getSummaryCounts(),
            getModules(),
            getUsersTasksCount(userId),
            getNewLeads(),
            getNewProjects(),
            getDailyTasks(),
            getUserMessages()
        ]);

        const crmModule = modules.find((module) => module.name === "crm" || module.name === "CRM"); // Case handling
        const projectsModule = modules.find((module) => module.name === "projects" || module.name === "Projects");

        // Build CRM entities
        const crmEntities: any[] = [];
        if (crmModule?.enabled) {
            crmEntities.push(
                { name: "Accounts", value: counts.accounts, href: "/crm/accounts", iconName: "LandmarkIcon", color: "cyan" },
                { name: "Contacts", value: counts.contacts, href: "/crm/contacts", iconName: "Contact", color: "violet" },
                { name: "Contracts", value: counts.contracts, href: "/crm/contracts", iconName: "FilePenLine", color: "rose" },

                { name: "Dialer", value: 0, href: "/crm/dialer", iconName: "Phone", color: "indigo" }, // Added
                { name: "Lead Wizard", value: 0, href: "/crm/lead-wizard", iconName: "Wand2", color: "cyan" }, // Added
                { name: "Lead Pools", value: 0, href: "/crm/lead-pools", iconName: "Target", color: "blue" }, // Added
                { name: "Leads Manager", value: counts.leads, href: "/crm/leads", iconName: "Users", color: "emerald" }, // Added
                { name: "Outreach", value: 0, href: "/crm/outreach", iconName: "Megaphone", color: "orange" }, // Renamed from Campaigns
                // "My Projects" was in the screenshot grid, adding here for visual match
                // "My Projects" was in the screenshot grid, adding here for visual match
                { name: "My Projects", value: counts.boards, href: "/campaigns", iconName: "Folder", color: "yellow" },
                // Leads removed as per user request to remove from "main admin panel"
                { name: "Opportunities", value: counts.opportunities, href: "/crm/opportunities", iconName: "HeartHandshake", color: "amber" },
            );
        }

        // Redundancy Removal: Merge Projects into main grid
        if (projectsModule?.enabled) {
            crmEntities.push(
                { name: "Projects", value: counts.boards, href: "/campaigns", iconName: "FolderKanban", color: "cyan" },
                { name: "My Tasks", value: usersTasks, href: `/campaigns/tasks/${userId}`, iconName: "Target", color: "emerald" },
            );
        }

        const projectEntities: any[] = [];

        return (
            <AdminDashboard
                userId={userId}
                userName={session.user.name || "User"}
                revenue={unifiedData?.summary?.revenue || 0}
                activePipelineCount={unifiedData?.summary?.activeDeals || 0}
                totalLeads={unifiedData?.summary?.leadsCount || 0}
                totalOpportunities={unifiedData?.summary?.opportunitiesCount || 0}
                activeUsersCount={activeUsersCount}
                crmEntities={crmEntities}
                projectEntities={projectEntities}
                newLeadsCount={Array.isArray(newLeads) ? newLeads.length : 0}
                newProjectsCount={Array.isArray(newProjects) ? newProjects.length : 0}
                allTasksCount={counts.tasks}
                messagesCount={Array.isArray(messages) ? messages.length : 0}
                myPipeline={
                    <Suspense fallback={<LoadingBox />}>
                        <MyPipelineSection userId={userId} />
                    </Suspense>
                }
                teamPipeline={
                    <Suspense fallback={<LoadingBox />}>
                        <TeamPipelineSection />
                    </Suspense>
                }
            />
        );
    }

    if (isMember) {
        const [dailyTasks, newLeads, newProjects, messages, userTasksCount] = await Promise.all([
            getDailyTasks(),
            getNewLeads(),
            getNewProjects(),
            getUserMessages(),
            getUsersTasksCount(userId)
        ]);

        return (
            <MemberDashboard
                userId={userId}
                dailyTasks={dailyTasks}
                newLeads={newLeads}
                newProjects={newProjects}
                messages={messages}
                userTasksCount={userTasksCount}
            />
        );
    }

    // Fallback: Viewer
    // Viewers might just need simple stats
    const unifiedData = await getUnifiedSalesData();

    return (
        <ViewerDashboard
            revenue={unifiedData?.summary?.revenue || 0}
            activePipelineCount={unifiedData?.summary?.activeDeals || 0}
        />
    );
};

export default DashboardRoleManager;
