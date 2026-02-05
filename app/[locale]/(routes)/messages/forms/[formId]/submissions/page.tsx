import { getCurrentUserTeamId } from '@/lib/team-utils';
import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "../../../../components/ui/Container";
import SuspenseLoading from "@/components/loadings/suspense";
import { prismadb } from "@/lib/prisma";
import { FormSubmissionsView } from "../../../submissions/components/FormSubmissionsView";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportButton } from "./components/ExportButton";

const SingleFormSubmissionsPage = async ({ params, searchParams }: { params: Promise<{ locale: string, formId: string }>, searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) => {
    const { locale, formId } = await params;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect("/");
    }

    // Use robust team logic
    const teamInfo = await getCurrentUserTeamId();
    const teamId = teamInfo?.teamId;
    const userId = session.user.id;
    const isGlobalAdmin = teamInfo?.isGlobalAdmin;

    // Fetch the specific form
    const form = await (prismadb as any).form.findUnique({
        where: { id: formId },
        select: {
            id: true,
            name: true,
            team_id: true,
            visibility: true,
            created_by: true,
            slug: true,
        }
    });

    if (!form) {
        return (
            <Container title="Form Not Found" description="The requested form could not be found.">
                <div className="mb-4">
                    <Link href={`/${locale}/messages/forms`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Forms
                        </Button>
                    </Link>
                </div>
                <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    Form not found or you do not have permission to view it.
                </div>
            </Container>
        );
    }

    // Access Control Logic
    // 1. Global Admins can see EVERYTHING.
    // 2. Team Members can see PUBLIC forms in their team.
    // 3. Creators can see their own PRIVATE forms.
    const hasAccess =
        isGlobalAdmin ||
        (form.team_id === teamId && form.visibility === "PUBLIC") ||
        (form.created_by === userId);

    if (!hasAccess) {
        return (
            <Container title="Access Denied" description="You do not have permission to view submissions for this form.">
                <div className="mb-4">
                    <Link href={`/${locale}/messages/forms`}>
                        <Button variant="ghost" size="sm" className="gap-2">
                            <ArrowLeft className="h-4 w-4" />
                            Back to Forms
                        </Button>
                    </Link>
                </div>
                <div className="bg-destructive/10 text-destructive p-4 rounded-md">
                    This form is private and can only be viewed by its creator.
                </div>
            </Container>
        );
    }

    // Fetch form submissions
    // If Global Admin, fetch ALL for that form regardless of team (though usually form belongs to one team).
    // If regular user, ensure we only fetch what matches the form (implicitly guarded by form access).
    const submissions = await (prismadb as any).formSubmission.findMany({
        where: {
            form_id: formId,
            ...(isGlobalAdmin ? {} : { team_id: teamId }), // Only restrict by team if not global admin
        },
        include: {
            form: {
                select: {
                    id: true,
                    name: true,
                    slug: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    return (
        <Container
            title={`Submissions: ${form.name}`}
            description={`View and manage submissions for ${form.name}`}
        >
            <div className="mb-4 flex items-center justify-between">
                <Link href={`/${locale}/messages/forms`}>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Forms
                    </Button>
                </Link>
                <ExportButton formId={formId} />
            </div>
            <Suspense fallback={<SuspenseLoading />}>
                <FormSubmissionsView
                    submissions={submissions}
                    forms={[form]} // Pass only this form
                    initialFormId={formId}
                    disableFormSelect={true} // Add this prop to view next
                />
            </Suspense>
        </Container>
    );
};

export default SingleFormSubmissionsPage;
