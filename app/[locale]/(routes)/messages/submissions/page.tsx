import React, { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "../../components/ui/Container";
import SuspenseLoading from "@/components/loadings/suspense";
import { prismadb } from "@/lib/prisma";
import { FormSubmissionsView } from "./components/FormSubmissionsView";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const FormSubmissionsPage = async ({ params }: { params: Promise<{ locale: string }> }) => {
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

    const teamId = (session.user as any).team_id;
    const userId = session.user.id;

    // Fetch form submissions with form info
    // Filter by visibility: PUBLIC forms show to all, PRIVATE forms only to creator
    const submissions = teamId ? await (prismadb as any).formSubmission.findMany({
        where: {
            team_id: teamId,
            form: {
                OR: [
                    { visibility: "PUBLIC" },
                    { visibility: "PRIVATE", created_by: userId },
                ],
            },
        },
        include: {
            form: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    visibility: true,
                    created_by: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    }) : [];

    // Fetch forms for filter (only forms user can see submissions for)
    const forms = teamId ? await (prismadb as any).form.findMany({
        where: {
            team_id: teamId,
            OR: [
                { visibility: "PUBLIC" },
                { visibility: "PRIVATE", created_by: userId },
            ],
        },
        select: {
            id: true,
            name: true,
            slug: true,
            visibility: true,
        },
        orderBy: { name: "asc" },
    }) : [];

    return (
        <Container
            title="Form Submissions"
            description="View and manage form submissions from your website forms"
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
                <FormSubmissionsView
                    submissions={submissions}
                    forms={forms}
                />
            </Suspense>
        </Container>
    );
};

export default FormSubmissionsPage;
