
import React, { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import PlansView from "./_components/PlansView";
import { getPlans } from "@/actions/plans/plan-actions";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";

const PlansPage = async () => {
    // Access Control
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) return redirect("/");

    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        include: { assigned_team: true }
    });

    const isInternalTeam = user?.assigned_team?.slug === "ledger1";
    const isAdmin = user?.is_admin || (isInternalTeam && (user?.team_role === "SUPER_ADMIN" || user?.team_role === "OWNER"));

    if (!isAdmin) {
        return redirect("/");
    }

    const plans = await getPlans();

    return (
        <Container
            title="Subscription Plans"
            description="Manage SaaS tiers, limits, and pricing."
        >
            <div className="p-4 space-y-4">
                <Link href="/partners">
                    <Button variant="ghost" className="mb-4">
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Back to Partners
                    </Button>
                </Link>
                {/* @ts-expect-error Server Component */}
                <PlansView initialPlans={plans} />
            </div>
        </Container>
    );
};

export default PlansPage;
