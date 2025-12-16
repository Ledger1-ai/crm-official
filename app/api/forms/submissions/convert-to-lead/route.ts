import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;
        const teamId = (session.user as any).team_id;

        if (!teamId) {
            return NextResponse.json({ error: "No team associated" }, { status: 400 });
        }

        const body = await req.json();
        const { submissionId } = body;

        if (!submissionId) {
            return NextResponse.json({ error: "Submission ID required" }, { status: 400 });
        }

        // Get the submission with form details
        const submission = await (prismadb as any).formSubmission.findUnique({
            where: { id: submissionId },
            include: {
                form: true,
            },
        });

        if (!submission) {
            return NextResponse.json({ error: "Submission not found" }, { status: 404 });
        }

        if (submission.team_id !== teamId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        if (submission.lead_id) {
            return NextResponse.json({ error: "Lead already created from this submission" }, { status: 400 });
        }

        // Check if form has a project assigned
        if (!submission.form?.project_id) {
            return NextResponse.json({
                error: "This form is not assigned to a project. Please assign a project to the form first before creating leads.",
                code: "NO_PROJECT"
            }, { status: 400 });
        }

        // Get the project (Board) name
        const project = await prismadb.boards.findUnique({
            where: { id: submission.form.project_id },
            select: { id: true, title: true },
        });

        if (!project) {
            return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        // Find or create the lead pool for form submissions
        const poolName = `Form Submissions for ${project.title}`;
        let leadPool = await prismadb.crm_Lead_Pools.findFirst({
            where: {
                name: poolName,
                user: userId,
                team_id: teamId,
            },
        });

        if (!leadPool) {
            // Create the pool
            leadPool = await prismadb.crm_Lead_Pools.create({
                data: {
                    name: poolName,
                    description: `Leads generated from form submissions for project: ${project.title}`,
                    user: userId,
                    team_id: teamId,
                    status: "ACTIVE",
                },
            });
        }

        // Parse name into first and last
        let firstName = "";
        let lastName = "";
        const extractedName = submission.extracted_name || submission.data?.name || submission.data?.full_name;
        if (extractedName) {
            const nameParts = extractedName.trim().split(/\s+/);
            firstName = nameParts[0] || "";
            lastName = nameParts.slice(1).join(" ") || "";
        }

        // Create the lead with data from submission
        const lead = await prismadb.crm_Leads.create({
            data: {
                firstName: firstName || submission.data?.first_name || submission.data?.firstName || "",
                lastName: lastName || submission.data?.last_name || submission.data?.lastName || "Lead",
                company: submission.extracted_company || submission.data?.company || "",
                email: submission.extracted_email || submission.data?.email || submission.data?.Email || "",
                phone: submission.extracted_phone || submission.data?.phone || submission.data?.Phone || "",
                description: `Lead generated from form submission: ${submission.form?.name || "Unknown Form"}\n\nSource: ${submission.source_url || "Direct"}`,
                lead_source: "FORM_SUBMISSION",
                assigned_to: userId,
                project: project.id, // Link to the project
                team_id: teamId,
                v: 0,
            },
        });

        // Add lead to the pool
        await prismadb.crm_Lead_Pools_Leads.create({
            data: {
                pool: leadPool.id,
                lead: lead.id,
            },
        });

        // Update submission with lead reference
        await (prismadb as any).formSubmission.update({
            where: { id: submissionId },
            data: {
                lead_id: lead.id,
                status: "CONVERTED",
                converted_at: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            lead,
            poolId: leadPool.id,
            poolName: leadPool.name,
        });
    } catch (error: any) {
        console.error("Error converting submission to lead:", error);
        return NextResponse.json({
            error: error?.message || "Internal server error",
            details: error?.code
        }, { status: 500 });
    }
}
