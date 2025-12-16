import { prismadb } from "@/lib/prisma";
import { TeamPortalForm } from "./TeamPortalForm";

interface TeamPortalSettingsProps {
    teamId: string;
}

export default async function TeamPortalSettings({ teamId }: TeamPortalSettingsProps) {
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
        console.warn("[TeamPortalSettings] Could not fetch portal:", e);
    }

    return (
        <TeamPortalForm
            teamId={teamId}
            initialPortal={portal}
        />
    );
}
