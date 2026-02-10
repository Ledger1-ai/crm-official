import { Suspense } from "react";
import SuspenseLoading from "@/components/loadings/suspense";
import { getCases } from "@/actions/crm/cases/get-cases";
import { getCaseStats } from "@/actions/crm/cases/get-case-stats";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import CasesClient from "./components/CasesClient";

export const dynamic = "force-dynamic";

const CasesPage = async () => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return null;

    const [cases, stats] = await Promise.all([
        getCases(),
        getCaseStats(),
    ]);

    // Get team members for assignment dropdown
    const user = await prismadb.users.findUnique({
        where: { id: session.user.id },
        select: { team_id: true },
    });

    let teamMembers: any[] = [];
    if (user?.team_id) {
        teamMembers = await prismadb.users.findMany({
            where: { team_id: user.team_id },
            select: { id: true, name: true, email: true, avatar: true },
        });
    }

    // Get contacts and accounts for case creation
    const contacts = await (prismadb as any).crm_Contacts.findMany({
        where: user?.team_id ? { team_id: user.team_id } : {},
        select: { id: true, first_name: true, last_name: true, email: true },
        take: 500,
    });

    const accounts = await (prismadb as any).crm_Accounts.findMany({
        where: user?.team_id ? { team_id: user.team_id } : {},
        select: { id: true, name: true },
        take: 500,
    });

    return (
        <Suspense fallback={<SuspenseLoading />}>
            <CasesClient
                initialCases={cases || []}
                stats={stats}
                teamMembers={teamMembers}
                contacts={contacts}
                accounts={accounts}
            />
        </Suspense>
    );
};

export default CasesPage;
