
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/(routes)/components/ui/Container";
import { redirect } from "next/navigation";
import { prismadb } from "@/lib/prisma";
import SystemResendConfigWrapper from "@/components/system/SystemResendConfigWrapper";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export default async function PartnerEmailConfigPage() {
    const session = await getServerSession(authOptions);

    if (!session) redirect("/sign-in");

    // Verify Partner/Admin Status
    const user = await prismadb.users.findUnique({ where: { email: session.user.email! }, include: { assigned_team: true } });

    const isPartner = user?.is_admin || user?.assigned_team?.slug === "ledger1" || user?.assigned_team?.slug === "basalt" || user?.assigned_team?.slug === "basalthq";

    if (!isPartner) {
        return redirect("/admin");
    }

    return (
        <Container
            title="System Email Configuration"
            description="Manage the Platform's Default Email Provider. This is the fallback email engine used by the entire platform if a team does not have their own provider configured."
        >
            <div className="p-4 space-y-6 max-w-5xl">
                <div>
                    <Link href="/partners">
                        <Button variant="ghost" className="pl-0 hover:pl-2 transition-all">
                            <ChevronLeft className="w-4 h-4 mr-1" />
                            Back to Platform
                        </Button>
                    </Link>
                </div>

                <div className="bg-card border rounded-lg p-6">
                    <SystemResendConfigWrapper />
                </div>
            </div>
        </Container>
    );
}
