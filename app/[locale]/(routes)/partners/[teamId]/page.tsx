import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, MessageSquare } from "lucide-react";

import Container from "@/app/[locale]/(routes)/components/ui/Container";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import { getTeam } from "@/actions/teams/get-team";
import { getPlans } from "@/actions/plans/plan-actions";
import TeamSettingsForm from "./_components/TeamSettingsForm";
import TeamMembersTable from "./_components/TeamMembersTable";
import SmsConfigForm from "./_components/SmsConfigForm";

const TeamDetailsPage = async ({ params }: { params: Promise<{ teamId: string }> }) => {
    const resolvedParams = await params;
    const [team, plans] = await Promise.all([
        getTeam(resolvedParams.teamId),
        getPlans()
    ]);
    const currentUserInfo = await getCurrentUserTeamId();

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

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    {currentUserInfo?.isGlobalAdmin && (
                        <TabsTrigger value="sms-config" className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            SMS Config
                        </TabsTrigger>
                    )}
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <TeamSettingsForm team={team} availablePlans={plans as any} />
                </TabsContent>
                <TabsContent value="members" className="space-y-4">
                    <TeamMembersTable
                        teamId={team.id}
                        teamSlug={team.slug}
                        members={team.members as any}
                        isSuperAdmin={currentUserInfo?.isGlobalAdmin}
                    />
                </TabsContent>
                {currentUserInfo?.isGlobalAdmin && (
                    <TabsContent value="sms-config" className="space-y-4">
                        <SmsConfigForm teamId={team.id} teamName={team.name} />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default TeamDetailsPage;
