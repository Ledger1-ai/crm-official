import React, { Suspense } from 'react';
import { getCurrentUserTeamId } from '@/lib/team-utils';
import SmsConfigForm from '@/components/sms/SmsConfigForm';
import { Card, CardContent } from '@/components/ui/card';
import { prismadb } from '@/lib/prisma';

export default async function SmsConfigPage() {
    const { teamId } = await getCurrentUserTeamId() || {};

    if (!teamId) {
        return (
            <div className="p-8">
                <Card>
                    <CardContent className="pt-6">
                        <div>No team assigned to your user account.</div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Fetch team name for the form
    const team = await prismadb.team.findUnique({
        where: { id: teamId },
        select: { name: true }
    });

    return (
        <div className="h-full flex-1 flex-col space-y-8 p-8 md:flex">
            <div className="flex items-center justify-between space-y-2">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">SMS Configuration</h2>
                    <p className="text-muted-foreground">
                        Manage your 10DLC brand and campaign registration settings.
                    </p>
                </div>
            </div>

            <Suspense fallback={<div>Loading...</div>}>
                <SmsConfigForm teamId={teamId} teamName={team?.name || "Team"} />
            </Suspense>
        </div>
    );
}
