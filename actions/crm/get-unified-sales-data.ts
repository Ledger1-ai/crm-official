import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Import existing actions to reuse logic and maintain compatibility
import { getSummaryCounts } from "@/actions/dashboard/get-summary-counts";
import { getTeamAnalytics, TeamAnalytics } from "@/actions/dashboard/get-team-analytics";
import { getLeadsStageCounts } from "@/actions/dashboard/get-leads-stage-counts";
import { LeadTouchMetrics, PipelineStage, STAGES, UserLeaderboardEntry } from "@/actions/dashboard/get-team-analytics";

export type UnifiedSalesData = {
    meta: {
        serverTime: string;
        userId: string;
        isGlobalAdmin: boolean; // Simplified for now, can check session role
    };
    summary: {
        revenue: number;
        activeDeals: number;
        leadsCount: number;
        opportunitiesCount: number;
        storagePercentage: number;
        activeUsers: number;
    };
    teamData: TeamAnalytics;
    userData: {
        myPipeline: {
            counts: Record<PipelineStage, number>;
            total: number;
        };
        myRank: number | null;
        myScore: number;
    };
};

export const getUnifiedSalesData = async (): Promise<UnifiedSalesData | null> => {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const userId = session.user.id;

    // Parallel fetch for maximum performance
    const [summaryCounts, teamAnalytics, userStageCounts] = await Promise.all([
        getSummaryCounts(),
        getTeamAnalytics(),
        getLeadsStageCounts(userId),
    ]);

    // Derive User Rank from Leaderboard
    const myLeaderboardEntry = teamAnalytics.leaderboard.find(u => u.userId === userId);
    const myRank = myLeaderboardEntry ? teamAnalytics.leaderboard.indexOf(myLeaderboardEntry) + 1 : null;
    const myScore = myLeaderboardEntry?.points || 0;

    // Calculate some derived summary metrics
    const activeDeals = summaryCounts.leads + summaryCounts.opportunities;
    const maxStorageMB = 10240;
    const storagePercentage = Math.min((summaryCounts.storageMB / maxStorageMB) * 100, 100);

    return {
        meta: {
            serverTime: new Date().toISOString(),
            userId,
            isGlobalAdmin: session.user.role === "ADMIN" || session.user.role === "PLATFORM_ADMIN", // Assuming role structure
        },
        summary: {
            revenue: summaryCounts.revenue,
            activeDeals,
            leadsCount: summaryCounts.leads,
            opportunitiesCount: summaryCounts.opportunities,
            storagePercentage,
            activeUsers: summaryCounts.users,
        },
        teamData: teamAnalytics,
        userData: {
            myPipeline: {
                counts: userStageCounts.overall.counts.byStage,
                total: userStageCounts.overall.counts.total,
            },
            myRank,
            myScore,
        },
    };
};
