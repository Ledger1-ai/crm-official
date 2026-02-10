import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

// POST: Email-to-Case — Parse inbound email and create a case
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { from, subject, body: emailBody, to, messageId } = body;

        if (!from || !subject) {
            return new NextResponse("from and subject are required", {
                status: 400,
            });
        }

        // Attempt to find a contact by email
        let contactId: string | undefined;
        let accountId: string | undefined;

        const contact = await (prismadb as any).crm_Contacts.findFirst({
            where: { email: from },
            select: { id: true, accountsIDs: true },
        });

        if (contact) {
            contactId = contact.id;
            accountId = contact.accountsIDs || undefined;
        }

        // Find the team that owns this address (if routed per team in future)
        // For now, use the first team with an SLA policy
        const defaultPolicy = await (prismadb as any).sLA_Policy.findFirst({
            where: { is_default: true, is_active: true },
            select: { id: true, team_id: true },
        });

        const teamId = defaultPolicy?.team_id || undefined;

        // Generate case number
        const lastCase = await (prismadb as any).crm_Cases.findFirst({
            where: teamId ? { team_id: teamId } : {},
            orderBy: { createdAt: "desc" },
            select: { case_number: true },
        });

        let caseNumber = "CS-00001";
        if (lastCase?.case_number) {
            const lastNum = parseInt(
                lastCase.case_number.replace("CS-", ""),
                10
            );
            caseNumber = `CS-${(lastNum + 1).toString().padStart(5, "0")}`;
        }

        // Get a system user or first admin for createdBy
        const systemUser = await (prismadb as any).users.findFirst({
            where: teamId
                ? { team_id: teamId, team_role: "ADMIN" }
                : { is_admin: true },
            select: { id: true },
        });

        const createdBy = systemUser?.id;
        if (!createdBy) {
            return new NextResponse(
                "No system user found to create case",
                { status: 500 }
            );
        }

        const newCase = await (prismadb as any).crm_Cases.create({
            data: {
                case_number: caseNumber,
                subject: subject,
                description: emailBody || "",
                status: "NEW",
                priority: "MEDIUM",
                origin: "EMAIL",
                contact_id: contactId,
                account_id: accountId,
                source_email_id: messageId || undefined,
                source_email_from: from,
                source_email_subject: subject,
                sla_policy_id: defaultPolicy?.id || undefined,
                team_id: teamId,
                createdBy,
            },
        });

        return NextResponse.json(
            { caseId: newCase.id, caseNumber: newCase.case_number },
            { status: 201 }
        );
    } catch (error) {
        console.error("[EMAIL_TO_CASE_POST]", error);
        return new NextResponse("Internal error", { status: 500 });
    }
}
