import React, { Suspense } from "react";
import Container from "@/app/[locale]/(routes)/components/ui/Container";

import { getTeams } from "@/actions/teams/get-teams";
import { getPlans } from "@/actions/plans/plan-actions";
import PartnersView from "./_components/PartnersView";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";

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

    const isInternalTeam = user.assigned_team?.slug === "ledger1";
    const isAdmin = user.is_admin;

    if (!isAdmin && !isInternalTeam) {
        return redirect("/");
    }

    const [teams, plans] = await Promise.all([
        getTeams(),
        getPlans()
    ]);

    return (
        <Container
            title="Partners"
            description="Manage your Teams and CRM Instances"
        >
            <div className="p-4">
                {/* @ts-expect-error Server Component */}
                <Suspense fallback={<div>Loading teams...</div>}>
                    <PartnersView initialTeams={teams as any} availablePlans={plans as any} />
                </Suspense>
            </div>
        </Container>
    );
};

export default PartnersPage;
