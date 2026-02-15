"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type ActionResponse = {
    success: boolean;
    data?: any;
    error?: string;
};

export async function convertLeadToOpportunity(leadId: string): Promise<ActionResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const lead = await prismadb.crm_Leads.findUnique({
            where: { id: leadId },
        });

        if (!lead) {
            return { success: false, error: "Lead not found" };
        }

        if (lead.status === "CONVERTED") {
            return { success: false, error: "Lead is already converted" };
        }

        // 1. Create/Find Contact
        let contactId = "";
        if (lead.email) {
            const existingContact = await prismadb.crm_Contacts.findFirst({
                where: { email: lead.email },
            });
            if (existingContact) {
                contactId = existingContact.id;
            }
        }

        if (!contactId) {
            const newContact = await prismadb.crm_Contacts.create({
                data: {
                    first_name: lead.firstName || "",
                    last_name: lead.lastName,
                    email: lead.email,
                    mobile_phone: lead.phone,
                    // company: lead.company, // Contact does not have company scalar
                    position: lead.jobTitle,
                    description: lead.company ? `Company: ${lead.company}\n${lead.description || ""}` : lead.description,
                    assigned_to_user: lead.assigned_to ? { connect: { id: lead.assigned_to } } : undefined,
                    crate_by_user: { connect: { id: session.user.id } }, // correct relation name from schema
                    type: "Prospect",
                },
            });
            contactId = newContact.id;
        }

        // 2. Create Opportunity
        const opportunityName = lead.company
            ? `${lead.company}`
            : `${lead.firstName} ${lead.lastName}`;

        // Project relation data
        const projectData = lead.project ? {
            assigned_project: {
                connect: { id: lead.project }
            }
        } : {};

        const newOpportunity = await prismadb.crm_Opportunities.create({
            data: {
                name: opportunityName,
                description: `Converted from Lead: ${lead.firstName} ${lead.lastName}\n\n${lead.description || ""}`,
                status: "ACTIVE",
                // pipeline_stage does not exist in crm_Opportunities

                createdBy: session.user.id,
                updatedBy: session.user.id,
                created_by_user: { connect: { id: session.user.id } }, // Relation (sets created_by)
                assigned_to_user: lead.assigned_to ? { connect: { id: lead.assigned_to } } : undefined,

                // Relations
                ...projectData,

                contacts: {
                    connect: [{ id: contactId }]
                },
                contact: contactId, // legacy scalar if needed

                budget: 0,
                expected_revenue: 0,
                close_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days default
            },
        });

        // 3. Update Lead
        await prismadb.crm_Leads.update({
            where: { id: leadId },
            data: {
                status: "CONVERTED",
                pipeline_stage: "Closed",
                outreach_status: "CLOSED",
            },
        });

        revalidatePath("/crm/leads");
        revalidatePath("/crm/opportunities");
        revalidatePath(`/crm/leads/${leadId}`);

        return {
            success: true,
            data: {
                opportunityId: newOpportunity.id,
                contactId
            }
        };

    } catch (error: any) {
        console.error("[CONVERT_LEAD]", error);
        return { success: false, error: error.message || "Failed to convert lead" };
    }
}
