import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

// Helper: Generate next case number
async function generateCaseNumber(teamId?: string): Promise<string> {
    const where: any = {};
    if (teamId) where.team_id = teamId;

    const lastCase = await (prismadb as any).crm_Cases.findFirst({
        where,
        orderBy: { createdAt: "desc" },
        select: { case_number: true },
    });

    if (!lastCase?.case_number) return "CS-00001";

    const lastNumber = parseInt(lastCase.case_number.replace("CS-", ""), 10);
    const nextNumber = (lastNumber + 1).toString().padStart(5, "0");
    return `CS-${nextNumber}`;
}

// Helper: Calculate SLA due dates
function calculateSLADueDates(
    policy: any,
    priority: string,
    createdAt: Date
) {
    const priorityKey = priority.toLowerCase();
    const firstResponseMinutes =
        policy[`first_response_${priorityKey}`] || policy.first_response_medium;
    const resolutionMinutes =
        policy[`resolution_${priorityKey}`] || policy.resolution_medium;

    return {
        first_response_due: new Date(
            createdAt.getTime() + firstResponseMinutes * 60 * 1000
        ),
        resolution_due: new Date(
            createdAt.getTime() + resolutionMinutes * 60 * 1000
        ),
    };
}

// POST: Create a new case
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const teamInfo = await getCurrentUserTeamId();
        const teamId = teamInfo?.teamId;
        const body = await req.json();

        const {
            subject,
            description,
            priority = "MEDIUM",
            origin = "WEB",
            type,
            reason,
            contact_id,
            account_id,
            assigned_to,
            tags = [],
            parent_case_id,
            sla_policy_id,
        } = body;

        if (!subject) {
            return new NextResponse("Subject is required", { status: 400 });
        }

        const caseNumber = await generateCaseNumber(teamId || undefined);

        // Resolve SLA policy
        let resolvedSLAPolicyId = sla_policy_id;
        if (!resolvedSLAPolicyId && teamId) {
            const defaultPolicy = await (prismadb as any).sLA_Policy.findFirst({
                where: { team_id: teamId, is_default: true, is_active: true },
            });
            if (defaultPolicy) resolvedSLAPolicyId = defaultPolicy.id;
        }

        // Build case data
        const caseData: any = {
            case_number: caseNumber,
            subject,
            description,
            status: "NEW",
            priority,
            origin,
            type: type || undefined,
            reason: reason || undefined,
            contact_id: contact_id || undefined,
            account_id: account_id || undefined,
            assigned_to: assigned_to || undefined,
            parent_case_id: parent_case_id || undefined,
            sla_policy_id: resolvedSLAPolicyId || undefined,
            tags,
            team_id: teamId,
            createdBy: session.user.id,
            updatedBy: session.user.id,
        };

        // Calculate SLA due dates if policy exists
        if (resolvedSLAPolicyId) {
            const policy = await (prismadb as any).sLA_Policy.findUnique({
                where: { id: resolvedSLAPolicyId },
            });
            if (policy) {
                const dueDates = calculateSLADueDates(
                    policy,
                    priority,
                    new Date()
                );
                caseData.first_response_due = dueDates.first_response_due;
                caseData.resolution_due = dueDates.resolution_due;
            }
        }

        const newCase = await (prismadb as any).crm_Cases.create({
            data: caseData,
            include: {
                contact: { select: { id: true, first_name: true, last_name: true } },
                account: { select: { id: true, name: true } },
                assigned_user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
        });

        // Create SLA milestone instances if policy exists
        if (resolvedSLAPolicyId) {
            const milestones = await (prismadb as any).sLA_Milestone.findMany({
                where: { policy_id: resolvedSLAPolicyId },
            });

            for (const milestone of milestones) {
                const priorityKey = priority.toLowerCase();
                const minutesField = `minutes_${priorityKey}`;
                const minutes = milestone[minutesField] || milestone.minutes_medium;

                await (prismadb as any).sLA_MilestoneInstance.create({
                    data: {
                        milestone_id: milestone.id,
                        case_id: newCase.id,
                        target_date: new Date(Date.now() + minutes * 60 * 1000),
                    },
                });
            }
        }

        return NextResponse.json(newCase, { status: 201 });
    } catch (error) {
        console.error("[CREATE_CASE_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// GET: List all cases for the team
export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const teamInfo = await getCurrentUserTeamId();
        const where: any = {};

        if (!teamInfo?.isGlobalAdmin) {
            if (!teamInfo?.teamId) return NextResponse.json([], { status: 200 });
            where.team_id = teamInfo.teamId;
        }

        // Parse query params for filtering
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status");
        const priority = searchParams.get("priority");
        const assigned_to = searchParams.get("assigned_to");

        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assigned_to) where.assigned_to = assigned_to;

        const cases = await (prismadb as any).crm_Cases.findMany({
            where,
            include: {
                contact: {
                    select: {
                        id: true,
                        first_name: true,
                        last_name: true,
                        email: true,
                    },
                },
                account: { select: { id: true, name: true } },
                assigned_user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
                sla_policy: { select: { id: true, name: true } },
                _count: { select: { comments: true } },
            },
            orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
        });

        return NextResponse.json(cases, { status: 200 });
    } catch (error) {
        console.error("[CASES_GET]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}

// PUT: Update a case
export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new NextResponse("Unauthenticated", { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, ...updateData } = body;

        if (!id) {
            return new NextResponse("Case ID is required", { status: 400 });
        }

        // Get current case for status transition tracking
        const currentCase = await (prismadb as any).crm_Cases.findUnique({
            where: { id },
            select: { status: true },
        });

        if (!currentCase) {
            return new NextResponse("Case not found", { status: 404 });
        }

        // Track status transition
        if (updateData.status && updateData.status !== currentCase.status) {
            await (prismadb as any).caseStatusTransition.create({
                data: {
                    case_id: id,
                    from_status: currentCase.status,
                    to_status: updateData.status,
                    changed_by: session.user.id,
                    reason: updateData.status_change_reason || null,
                },
            });

            // Auto-fill timestamps
            if (
                updateData.status === "RESOLVED" ||
                updateData.status === "CLOSED"
            ) {
                if (updateData.status === "RESOLVED") {
                    updateData.resolvedAt = new Date();
                }
                if (updateData.status === "CLOSED") {
                    updateData.closedAt = new Date();
                }
            }
        }

        // Clean up non-model fields
        delete updateData.status_change_reason;

        const updatedCase = await (prismadb as any).crm_Cases.update({
            where: { id },
            data: {
                ...updateData,
                updatedBy: session.user.id,
            },
            include: {
                contact: {
                    select: { id: true, first_name: true, last_name: true },
                },
                account: { select: { id: true, name: true } },
                assigned_user: {
                    select: { id: true, name: true, email: true, avatar: true },
                },
            },
        });

        return NextResponse.json(updatedCase, { status: 200 });
    } catch (error) {
        console.error("[UPDATE_CASE_PUT]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
