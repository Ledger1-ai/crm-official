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

export async function closeDealAndCreateProject(opportunityId: string): Promise<ActionResponse> {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return { success: false, error: "Unauthorized" };
        }

        const opportunity = await prismadb.crm_Opportunities.findUnique({
            where: { id: opportunityId },
            include: {
                contacts: true,
                assigned_account: true,
            },
        });

        if (!opportunity) {
            return { success: false, error: "Opportunity not found" };
        }

        if (opportunity.status === "CLOSED") {
            return { success: false, error: "Opportunity is already closed won" };
        }

        // Create a new Project (Board)
        const projectTitle = opportunity.name || "New Project";
        const projectDescription = opportunity.description || `Project created from opportunity: ${opportunity.name}`;

        const newProject = await prismadb.boards.create({
            data: {
                v: 0,
                title: projectTitle,
                description: projectDescription,
                visibility: "private",
                status: "ACTIVE", // ProjectStatus enum
                user: session.user.id,
                createdBy: session.user.id,
                updatedBy: session.user.id,
                team_id: opportunity.team_id,
            },
        });

        const projectId = newProject.id;

        // Create default sections properly formatted for createMany
        const defaultSections = [
            { title: "To Do", position: 0 },
            { title: "In Progress", position: 1 },
            { title: "Done", position: 2 }
        ].map(s => ({
            v: 0,
            board: projectId,
            title: s.title,
            position: s.position
        }));

        // Create sections separately
        await prismadb.sections.createMany({
            data: defaultSections
        });

        // Add creator as Project Member (Lead)
        await prismadb.projectMember.create({
            data: {
                project: projectId,
                user: session.user.id,
                role: "LEAD",
                assignedBy: session.user.id,
            }
        });

        // Update Opportunity
        await prismadb.crm_Opportunities.update({
            where: { id: opportunityId },
            data: {
                status: "CLOSED", // crm_Opportunity_Status enum
                project: projectId,
            },
        });

        revalidatePath(`/crm/opportunities/${opportunityId}`);
        revalidatePath("/campaigns");

        return {
            success: true,
            data: { projectId }
        };

    } catch (error: any) {
        console.error("[CLOSE_DEAL]", error);
        return { success: false, error: error.message || "Failed to close deal" };
    }
}
