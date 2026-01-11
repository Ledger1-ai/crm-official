import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { TeamEmailSettings } from "@/components/email/TeamEmailSettings";
import { EmailDeliveryStats } from "@/components/email/EmailDeliveryStats";
import SystemResendConfigWrapper from "@/components/system/SystemResendConfigWrapper";
import { redirect } from "next/navigation";

export default async function AdminSettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return redirect("/sign-in");
    }

    const user = await prismadb.users.findUnique({
        where: { email: session.user.email },
        select: { assigned_team: { select: { id: true } } }
    });

    return (
        <Container title="Email Settings" description="Manage email sender identity and system keys.">
            <div className="space-y-8 p-4">
                {user?.assigned_team?.id ? (
                    <>
                        {/* System Resend Config (Global) */}
                        <div className="bg-card border rounded-lg p-6">
                            <h4 className="text-sm font-medium mb-4">System Resend Key</h4>
                            <SystemResendConfigWrapper />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <TeamEmailSettings teamId={user.assigned_team.id} />
                            <EmailDeliveryStats teamId={user.assigned_team.id} />
                        </div>
                    </>
                ) : (
                    <div className="p-4 bg-muted rounded-md text-sm text-muted-foreground">
                        You do not have a team assigned. Please contact support.
                    </div>
                )}
            </div>
        </Container>
    );
}
