import React, { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "../../components/ui/Container";
import SuspenseLoading from "@/components/loadings/suspense";
import { prismadb } from "@/lib/prisma";
import { FormBuilderView } from "./components/FormBuilderView";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUserTeamId } from "@/lib/team-utils";

const FormsPage = async ({ params }: { params: Promise<{ locale: string }> }) => {
    const { locale } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        return {
            redirect: {
                destination: "/",
                permanent: false,
            },
        };
    }

    // Get team ID properly using the team-utils function
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;

    // Fetch existing forms
    const forms = teamId ? await (prismadb as any).form.findMany({
        where: { team_id: teamId },
        include: {
            fields: {
                orderBy: { position: "asc" },
            },
            _count: {
                select: { submissions: true },
            },
        },
        orderBy: { createdAt: "desc" },
    }) : [];

    // Fetch projects (Boards) for form association - use same logic as getBoards action
    const whereClause: any = {};
    if (teamId && !teamInfo?.isGlobalAdmin) {
        whereClause.team_id = teamId;
    }

    const projects = await prismadb.boards.findMany({
        where: whereClause,
        select: {
            id: true,
            title: true,
        },
        orderBy: { title: "asc" },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || "https://yourdomain.com";

    return (
        <Container
            title="Form Builder"
            description="Create and manage lead capture forms for your websites"
        >
            <div className="mb-4">
                <Link href={`/${locale}/messages`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Messages
                    </Button>
                </Link>
            </div>
            <Suspense fallback={<SuspenseLoading />}>
                <FormBuilderView
                    forms={forms}
                    projects={projects}
                    baseUrl={baseUrl}
                    currentUserId={session.user.id}
                />
            </Suspense>
        </Container>
    );
};

export default FormsPage;
