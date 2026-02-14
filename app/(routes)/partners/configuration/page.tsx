
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/(routes)/components/ui/Container";
import UnifiedAiCard from "@/app/cms/(dashboard)/_components/UnifiedAiCard";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PartnerAiConfigPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) redirect("/sign-in");

    const user = await prismadb.users.findUnique({
        where: { email: session.user.email },
        include: { assigned_team: true }
    });

    // Strict check for Basalt team or Admin
    // (Reusing logic from PartnersPage)
    const isInternalTeam = user?.assigned_team?.slug === "ledger1" || user?.assigned_team?.slug === "basalt" || user?.assigned_team?.slug === "basalthq";
    const isAdmin = user?.is_admin;

    if (!isAdmin && !isInternalTeam) {
        return redirect("/");
    }

    return (
        <Container
            title="Partner AI Configuration"
            description="Manage System-wide AI Providers, API Keys, and Default Models."
        >
            <div className="p-4 space-y-4">
                <div className="flex gap-4 mb-6">
                    <Link href="/partners">
                        <Button variant="outline">
                            &larr; Back to Platform
                        </Button>
                    </Link>
                    <Link href="/partners/ai-pricing">
                        <Button variant="outline">
                            Manage AI Pricing
                        </Button>
                    </Link>
                </div>

                <div className="max-w-5xl">
                    <UnifiedAiCard />
                </div>
            </div>
        </Container>
    );
}
