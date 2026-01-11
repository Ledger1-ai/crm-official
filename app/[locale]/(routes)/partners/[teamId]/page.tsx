import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import TeamDetailsView from "./_components/TeamDetailsView";
import { prismadb } from "@/lib/prisma";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { getTeam } from "@/actions/teams/get-team";
import { getPlans } from "@/actions/plans/plan-actions";


const TeamDetailsPage = async ({ params }: { params: Promise<{ teamId: string }> }) => {
    const resolvedParams = await params;
    const [team, plans] = await Promise.all([
        getTeam(resolvedParams.teamId),
        getPlans()
    ]);
    const currentUserInfo = await getCurrentUserTeamId();

    // Fetch System Resend Key Data for Global Admins
    let systemResendData = { resendKeyId: "", envKey: undefined as string | undefined, dbKey: undefined as string | undefined };
    let ownerInfo = null;
    let roleCounts = { owner: 0, admin: 0, member: 0, viewer: 0 };
    let customRoles: any[] = [];

    if (currentUserInfo?.isGlobalAdmin && team) {
        const [resend_key, owner, roleCountsData, customRolesData] = await Promise.all([
            prismadb.systemServices.findFirst({
                where: { name: "resend_smtp" },
            }),
            // Fetch owner info
            team.owner_id ? prismadb.users.findUnique({
                where: { id: team.owner_id },
                select: { id: true, name: true, email: true, phone: true }
            }) : null,
            // Fetch role counts for this team
            Promise.all([
                prismadb.users.count({ where: { team_id: team.id, team_role: "OWNER" } }),
                prismadb.users.count({ where: { team_id: team.id, team_role: "ADMIN" } }),
                prismadb.users.count({ where: { team_id: team.id, OR: [{ team_role: "MEMBER" }, { team_role: null }] } }),
                prismadb.users.count({ where: { team_id: team.id, team_role: "VIEWER" } }),
            ]),
            // Fetch custom roles for this team
            prismadb.customRole.findMany({
                where: { team_id: team.id },
                include: { _count: { select: { users: true } } },
                orderBy: { created_at: "asc" },
            }),
        ]);

        systemResendData = {
            resendKeyId: resend_key?.id ?? "",
            envKey: process.env.RESEND_API_KEY,
            dbKey: resend_key?.serviceKey || undefined,
        };

        ownerInfo = owner;
        roleCounts = {
            owner: roleCountsData[0],
            admin: roleCountsData[1],
            member: roleCountsData[2],
            viewer: roleCountsData[3],
        };
        customRoles = customRolesData;
    }

    if (!team) {
        return notFound();
    }

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center space-x-4 mb-4">
                <Link href="/partners" className="btn btn-ghost btn-sm">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Back
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">{team.name}</h2>
            </div>

            <TeamDetailsView
                team={team}
                availablePlans={plans}
                currentUserInfo={currentUserInfo}
                systemResendData={systemResendData}
                ownerInfo={ownerInfo}
                roleCounts={roleCounts}
                customRoles={customRoles}
            />
        </div>
    );
};

export default TeamDetailsPage;

