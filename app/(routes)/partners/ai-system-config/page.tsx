
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/(routes)/components/ui/Container";
import UnifiedAiCard from "@/app/cms/(dashboard)/_components/UnifiedAiCard";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import { PartnersNavigation } from "../_components/PartnersNavigation";
import { getPlans } from "@/actions/plans/plan-actions";

export default async function PartnerAiConfigPage() {
    const session = await getServerSession(authOptions);

    if (!session) redirect("/sign-in");

    // Verify Partner/Admin Status
    const user = await prismadb.users.findUnique({ where: { email: session.user.email! }, include: { assigned_team: true } });

    const isPartner = user?.is_admin || user?.assigned_team?.slug === "ledger1" || user?.assigned_team?.slug === "basalt" || user?.assigned_team?.slug === "basalthq";

    if (!isPartner) {
        return redirect("/admin");
    }

    const plans = await getPlans();

    return (
        <Container
            title="System AI Configuration"
            description="Manage the Platform's System API Keys and Default Models. These keys are used by teams unless they provide their own."
        >
            <div className="p-4 space-y-6 max-w-5xl">
                <PartnersNavigation
                    availablePlans={plans as any}
                    showBackButton={true}
                    hideCreateTeam={true}
                    hideSystemKeys={true}
                    hideManagePlans={true}
                />
                <UnifiedAiCard />
            </div>
        </Container>
    );
}
