import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import Container from "@/app/[locale]/(routes)/components/ui/Container";
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";

import { getTeam } from "@/actions/teams/get-team";
import TeamSettingsForm from "./_components/TeamSettingsForm";
import TeamMembersTable from "./_components/TeamMembersTable";

const TeamDetailsPage = async ({ params }: { params: Promise<{ teamId: string }> }) => {
    const resolvedParams = await params;
    const team = await getTeam(resolvedParams.teamId);

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
                    {/* <TabsTrigger value="settings">Settings</TabsTrigger> */}
                </TabsList>
                <TabsContent value="overview" className="space-y-4">
                    <TeamSettingsForm team={team} />
                </TabsContent>
                <TabsContent value="members" className="space-y-4">
                    <TeamMembersTable teamId={team.id} members={team.members as any} />
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default TeamDetailsPage;
