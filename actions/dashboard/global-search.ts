"use server";

import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface SearchResult {
    type: "task" | "lead" | "project" | "opportunity" | "account" | "contact" | "contract" | "invoice" | "document" | "user";
    id: string;
    title: string;
    subtitle?: string | null;
    url: string;
}

export const globalSearch = async (query: string): Promise<SearchResult[]> => {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !query || query.length < 2) return [];

    const q = query.trim();
    const insensitive = 'insensitive' as const;

    // 1. User Context & Permissions
    const currentUser = await prismadb.users.findUnique({
        where: { id: session.user.id },
        include: { assigned_role: true },
    });

    if (!currentUser) return [];

    const roleName = currentUser.assigned_role?.name?.toUpperCase() || "";
    const isSuperAdmin = currentUser.is_admin || roleName.includes("ADMIN");
    const userId = currentUser.id;
    const teamId = currentUser.team_id;

    // Helpers for Where Clauses (Copied from route.ts for consistency)
    const getWhereClause = (searchConditions: any[]) => {
        if (isSuperAdmin) return { OR: searchConditions };
        return {
            AND: [
                { OR: searchConditions },
                {
                    OR: [
                        { assigned_to: userId },
                        // Conditionally add team_id check if teamId exists
                        ...(teamId ? [{ team_id: teamId }] : []),
                        // Most CRM entities might not have createdBy but we add if schema supports
                    ],
                },
            ],
        };
    };

    const getTaskWhereClause = (searchConditions: any[]) => {
        if (isSuperAdmin) return { OR: searchConditions };
        return {
            AND: [
                { OR: searchConditions },
                {
                    OR: [
                        { user: userId },
                        ...(teamId ? [{ team_id: teamId }] : []),
                    ],
                },
            ],
        };
    };

    // Invoices
    const getInvoiceWhereClause = (searchConditions: any[]) => {
        if (isSuperAdmin) {
            return { OR: searchConditions };
        }
        return {
            AND: [
                { OR: searchConditions },
                {
                    OR: [
                        { assigned_user_id: userId },
                        ...(teamId ? [{ team_id: teamId }] : []),
                    ],
                },
            ],
        };
    };

    // Documents
    const getDocumentWhereClause = (searchConditions: any[]) => {
        if (isSuperAdmin) {
            return { OR: searchConditions };
        }
        return {
            AND: [
                { OR: searchConditions },
                {
                    OR: [
                        { assigned_user: userId },
                        { createdBy: userId },
                        ...(teamId ? [{ team_id: teamId }] : []),
                    ],
                },
            ],
        };
    };

    // 2. Execute Queries Parallelly
    const tasksPromise = prismadb.tasks.findMany({
        where: getTaskWhereClause([
            { title: { contains: q, mode: insensitive } },
            { content: { contains: q, mode: insensitive } },
        ]),
        take: 3,
        select: { id: true, title: true, assigned_section: { select: { board: true } } },
    });

    const leadsPromise = prismadb.crm_Leads.findMany({
        where: getWhereClause([
            { firstName: { contains: q, mode: insensitive } },
            { lastName: { contains: q, mode: insensitive } },
            { company: { contains: q, mode: insensitive } },
            { email: { contains: q, mode: insensitive } },
        ]),
        take: 3,
        select: { id: true, firstName: true, lastName: true, company: true },
    });

    const projectsPromise = prismadb.boards.findMany({
        where: isSuperAdmin
            ? { title: { contains: q, mode: insensitive } }
            : {
                AND: [
                    { title: { contains: q, mode: insensitive } },
                    { OR: [{ user: userId }, { sharedWith: { has: userId } }, ...(teamId ? [{ team_id: teamId }] : [])] }
                ]
            },
        take: 3,
        select: { id: true, title: true },
    });

    const opportunitiesPromise = prismadb.crm_Opportunities.findMany({
        where: getWhereClause([
            { name: { contains: q, mode: insensitive } },
            { description: { contains: q, mode: insensitive } },
        ]),
        take: 3,
        select: { id: true, name: true, description: true },
        orderBy: { updatedAt: 'desc' }
    });

    const accountsPromise = prismadb.crm_Accounts.findMany({
        where: getWhereClause([
            { name: { contains: q, mode: insensitive } },
            { description: { contains: q, mode: insensitive } },
            { email: { contains: q, mode: insensitive } },
        ]),
        take: 3,
        select: { id: true, name: true, email: true },
        orderBy: { updatedAt: 'desc' }
    });

    const contactsPromise = prismadb.crm_Contacts.findMany({
        where: getWhereClause([
            { first_name: { contains: q, mode: insensitive } },
            { last_name: { contains: q, mode: insensitive } },
            { email: { contains: q, mode: insensitive } },
        ]),
        take: 3,
        select: { id: true, first_name: true, last_name: true, email: true },
        orderBy: { updatedAt: 'desc' }
    });

    const contractsPromise = prismadb.crm_Contracts.findMany({
        where: getWhereClause([
            { title: { contains: q, mode: insensitive } },
            { description: { contains: q, mode: insensitive } },
        ]),
        take: 3,
        select: { id: true, title: true, description: true },
        orderBy: { updatedAt: 'desc' }
    });

    const invoicesPromise = prismadb.invoices.findMany({
        where: getInvoiceWhereClause([
            { invoice_number: { contains: q, mode: insensitive } },
            { description: { contains: q, mode: insensitive } },
            { partner: { contains: q, mode: insensitive } },
        ]),
        take: 3,
        select: { id: true, invoice_number: true, description: true, partner: true },
        orderBy: { last_updated: 'desc' }
    });

    const documentsPromise = prismadb.documents.findMany({
        where: getDocumentWhereClause([
            { document_name: { contains: q, mode: insensitive } },
            { description: { contains: q, mode: insensitive } },
        ]),
        take: 3,
        select: { id: true, document_name: true, description: true },
        orderBy: { updatedAt: 'desc' }
    });


    const [
        tasks, leads, projects, opportunities, accounts, contacts, contracts, invoices, documents
    ] = await Promise.all([
        tasksPromise, leadsPromise, projectsPromise, opportunitiesPromise, accountsPromise, contactsPromise, contractsPromise, invoicesPromise, documentsPromise
    ]);

    const results: SearchResult[] = [];

    // Map Results
    tasks.forEach(t => results.push({
        type: "task",
        id: t.id,
        title: t.title,
        subtitle: "Task",
        url: t.assigned_section?.board ? `/projects/boards/${t.assigned_section.board}?task=${t.id}` : "#",
    }));

    leads.forEach(l => results.push({
        type: "lead",
        id: l.id,
        title: `${l.firstName || ""} ${l.lastName || ""}`.trim() || l.company || "Unknown Lead",
        subtitle: l.company || "Lead",
        url: `/crm/leads/${l.id}`,
    }));

    opportunities.forEach(i => results.push({
        type: "opportunity",
        id: i.id,
        title: i.name || "Untitled Opportunity",
        subtitle: i.description,
        url: `/crm/opportunities/${i.id}`,
    }));

    accounts.forEach(i => results.push({
        type: "account",
        id: i.id,
        title: i.name,
        subtitle: i.email,
        url: `/crm/accounts/${i.id}`,
    }));

    contacts.forEach(i => results.push({
        type: "contact",
        id: i.id,
        title: `${i.first_name || ""} ${i.last_name || ""}`.trim(),
        subtitle: i.email,
        url: `/crm/contacts/${i.id}`,
    }));

    contracts.forEach(i => results.push({
        type: "contract",
        id: i.id,
        title: i.title,
        subtitle: i.description,
        url: `/crm/contracts/${i.id}`,
    }));

    invoices.forEach(i => results.push({
        type: "invoice",
        id: i.id,
        title: i.invoice_number || "Draft Invoice",
        subtitle: i.partner || i.description,
        url: `/crm/invoices/${i.id}`,
    }));

    documents.forEach(i => results.push({
        type: "document",
        id: i.id,
        title: i.document_name,
        subtitle: i.description,
        url: `/documents/view/${i.id}`,
    }));

    projects.forEach(p => results.push({
        type: "project",
        id: p.id,
        title: p.title,
        subtitle: "Project",
        url: `/projects/boards/${p.id}`,
    }));

    return results;
};
