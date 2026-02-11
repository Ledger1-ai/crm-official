import React, { Suspense } from "react";
import Container from "@/app/[locale]/(routes)/components/ui/Container";

import { getTeams } from "@/actions/teams/get-teams";
import { getPlans } from "@/actions/plans/plan-actions";
import PartnersView from "./_components/PartnersView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import Link from "next/link";
import { PartnersNavigation } from "./_components/PartnersNavigation";

const PartnersPage = async () => {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
        return redirect("/");
    }

    const user = await (prismadb.users as any).findUnique({
        where: { id: session.user.id },
        include: { assigned_team: true }
    });

    if (!user) {
        return redirect("/");
    }

    const isInternalTeam = user.assigned_team?.slug === "ledger1" || user.assigned_team?.slug === "basalt" || user.assigned_team?.slug === "basalthq";
    const isAdmin = user.is_admin;

    if (!isAdmin && !isInternalTeam) {
        return redirect("/");
    }

    const [teams, plans] = await Promise.all([
        getTeams(),
        getPlans()
    ]);

    // Calculate total users from actual team members to ensure consistency
    const uniqueUserIds = new Set<string>();
    (teams as any[]).forEach(team => {
        team.members.forEach((member: any) => {
            if (member.id) uniqueUserIds.add(member.id);
        });
    });
    const totalUsers = uniqueUserIds.size;

    const activeTeamsCount = (teams as any[]).filter(t => t.status === 'ACTIVE').length;
    const totalTeamsCount = (teams as any[]).length;

    return (
        <Container
            title="Platform"
            description="Manage your Teams and CRM Instances"
        >
            <div className="p-4 space-y-6">
                <PartnersNavigation availablePlans={plans as any} />

                {/* Global Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-card border rounded-lg shadow-sm">
                        <div className="text-sm text-muted-foreground font-medium">Total Teams</div>
                        <div className="text-2xl font-bold">{totalTeamsCount}</div>
                    </div>
                    <div className="p-4 bg-card border rounded-lg shadow-sm">
                        <div className="text-sm text-muted-foreground font-medium">Active Teams</div>
                        <div className="text-2xl font-bold">{activeTeamsCount}</div>
                    </div>
                    <div className="p-4 bg-card border rounded-lg shadow-sm">
                        <div className="text-sm text-muted-foreground font-medium">Total Users</div>
                        <div className="text-2xl font-bold">{totalUsers}</div>
                    </div>
                </div>

                <Suspense fallback={<div>Loading teams...</div>}>
                    <PartnersView initialTeams={teams as any} availablePlans={plans as any} />
                </Suspense>
            </div>
        </Container>
    );
};

export default PartnersPage;
