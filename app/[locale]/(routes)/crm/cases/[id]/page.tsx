import { getCase } from "@/actions/crm/cases/get-case";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CaseDetailClient from "./components/CaseDetailClient";

export const dynamic = "force-dynamic";

interface CaseDetailPageProps {
    params: Promise<{ id: string }>;
}

const CaseDetailPage = async ({ params }: CaseDetailPageProps) => {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return redirect("/login");

    const caseData = await getCase(id);
    if (!caseData) return redirect("/crm/cases");

    // Get team members for reassignment
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

    return (
        <CaseDetailClient
            caseData={caseData}
            currentUserId={session.user.id}
            teamMembers={teamMembers}
        />
    );
};

export default CaseDetailPage;
