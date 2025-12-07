
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import UnifiedAiCard from "@/app/[locale]/cms/(dashboard)/_components/UnifiedAiCard";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";

export default async function PartnerAiConfigPage() {
    const session = await getServerSession(authOptions);

    if (!session) redirect("/sign-in");

    // Verify Partner/Admin Status
    const user = await prismadb.users.findUnique({ where: { email: session.user.email! }, include: { assigned_team: true } });

    const isPartner = user?.is_admin || user?.assigned_team?.slug === "ledger1";

    if (!isPartner) {
        return redirect("/admin");
    }

    return (
        <Container
            title="System AI Configuration"
            description="Manage the Platform's System API Keys and Default Models. These keys are used by teams unless they provide their own."
        >
            <div className="max-w-5xl space-y-8">
                <UnifiedAiCard />
            </div>
        </Container>
    );
}
