/**
 * Portal Settings Page - CMS Administration
 * Only accessible to team admins
 */

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import { TeamPortalForm } from "@/app/[locale]/(routes)/settings/team/_components/TeamPortalForm";

export default async function PortalSettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return redirect("/sign-in");
    }

    // Get user with team info
    const user = await prismadb.users.findUnique({
        where: { email: session.user.email },
        include: { assigned_team: true }
    });

    // Check if user is a team admin
    const isTeamAdmin = user?.is_account_admin || user?.is_admin;

    if (!isTeamAdmin) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
                    <p className="text-muted-foreground mt-2">
                        You must be a team administrator to access portal settings.
                    </p>
                </div>
            </div>
        );
    }

    if (!user?.assigned_team?.id) {
        return (
            <div className="p-8 max-w-4xl mx-auto">
                <div className="text-center py-12">
                    <h2 className="text-xl font-semibold">No Team Assigned</h2>
                    <p className="text-muted-foreground mt-2">
                        You must be assigned to a team to configure portal settings.
                    </p>
                </div>
            </div>
        );
    }

    const teamId = user.assigned_team.id;

    // Fetch existing portal for this team
    let portal = null;
    try {
        portal = await (prismadb as any).crm_Message_Portal.findFirst({
            where: { team: teamId },
            include: {
                _count: {
                    select: {
                        recipients: true,
                        messages: true,
                    },
                },
            },
        });
    } catch (e) {
        // Portal table might not exist yet if migration hasn't run
        console.warn("[PortalSettingsPage] Could not fetch portal:", e);
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold">Message Portal Settings</h1>
                <p className="text-muted-foreground">
                    Configure your team&apos;s SMS message portal branding and settings.
                </p>
            </div>

            <TeamPortalForm
                teamId={teamId}
                initialPortal={portal}
            />
        </div>
    );
}
