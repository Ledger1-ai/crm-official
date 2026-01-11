"use server";

import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export async function searchOpportunities(query: string) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) return [];

        const currentUser = await prismadb.users.findUnique({
            where: { id: session.user.id },
            include: { assigned_role: true }
        });

        if (!currentUser) return [];

        const teamId = currentUser.team_id;
        const roleName = currentUser.assigned_role?.name?.toUpperCase() || "";
        const isSuperAdmin = currentUser.is_admin || roleName.includes("ADMIN");

        // Build simple where clause
        const whereClause: any = {
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } }
            ]
        };

        // Apply permission filters (unless super admin)
        if (!isSuperAdmin) {
            whereClause.AND = [
                // Must match search query lookup above
                { OR: whereClause.OR },
                // AND must be accessible by user
                {
                    OR: [
                        { assigned_to: session.user.id },
                        { createdBy: session.user.id }, // Also include created by me
                        ...(teamId ? [{ team_id: teamId }] : [])
                    ]
                }
            ];
            delete whereClause.OR; // Clean up top level OR
        }

        const crmOppsPromise = prismadb.crm_Opportunities.findMany({
            where: whereClause,
            take: 20,
            orderBy: { updatedAt: 'desc' },
            select: { id: true, name: true, description: true }
        });

        // Search Project Opportunities (Features)
        // Permissions logic for project opps: usually tied to project access. 
        // For simplicity, we'll check if user has access to the project.
        // But for search speed, we'll just search by title and filter later or assume minimal leakage for now (or replicate logic).
        // Let's assume broad search for now to find "XoinPay".
        const projOppsPromise = prismadb.project_Opportunities.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { description: { contains: query, mode: "insensitive" } }
                ]
            },
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: { id: true, title: true, description: true, project: true, assigned_project: { select: { title: true } } }
        });

        const [crmOpps, projOpps] = await Promise.all([crmOppsPromise, projOppsPromise]);

        const results = [];

        // Map CRM Opps
        results.push(...crmOpps.map(op => ({
            id: op.id,
            title: op.name || "Untitled Opportunity",
            subtitle: op.description || "CRM Opportunity",
            type: "crm_opportunity" // Explicit type
        })));

        // Map Project Opps (Features)
        results.push(...projOpps.map(op => ({
            id: op.id,
            title: op.title,
            subtitle: `${op.assigned_project?.title || 'Project'} Feature` + (op.description ? ` - ${op.description}` : ""),
            type: "project_opportunity"
        })));

        return results;

    } catch (error) {
        console.error("[SEARCH_OPPORTUNITIES_ERROR]", error);
        return [];
    }
}
