import { NextResponse } from "next/server";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return new NextResponse("Unauthenticated", { status: 401 });
  }

  try {
    const body = await req.json();
    const search = body.data;

    // 1. Fetch current user to get role and team context
    const currentUser = await prismadb.users.findUnique({
      where: { id: session.user.id },
      include: {
        assigned_role: true,
      },
    });

    if (!currentUser) {
      return new NextResponse("User not found", { status: 401 });
    }

    const roleName = currentUser.assigned_role?.name?.toUpperCase() || "";

    // Determine if user has global access
    const isSuperAdmin =
      currentUser.is_admin ||
      roleName.includes("ADMIN");

    const userId = currentUser.id;
    const teamId = currentUser.team_id;

    // Helper type for Insensitive Mode to satisfy TS
    const insensitive = 'insensitive' as const;

    // Helper to generate where clause for standard CRM entities (Account, Lead, Opportunity)
    const getWhereClause = (searchConditions: any[]) => {
      if (isSuperAdmin) {
        return { OR: searchConditions };
      }
      return {
        AND: [
          { OR: searchConditions },
          {
            OR: [
              { assigned_to: userId },
              ...(teamId ? [{ team_id: teamId }] : []),
              { createdBy: userId },
            ],
          },
        ],
      };
    };

    // Helper for Tasks (uses `user` field)
    const getTaskWhereClause = (searchConditions: any[]) => {
      if (isSuperAdmin) {
        return { OR: searchConditions };
      }
      return {
        AND: [
          { OR: searchConditions },
          {
            OR: [
              { user: userId },
              ...(teamId ? [{ team_id: teamId }] : []),
              { createdBy: userId },
            ],
          },
        ],
      };
    };

    // Helper for Invoices (uses `assigned_user_id`)
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

    // Helper for Documents
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

    // 3. Execute Parallel Queries

    // CRM Opportunities
    const pOpportunities = prismadb.crm_Opportunities.findMany({
      where: getWhereClause([
        { description: { contains: search, mode: insensitive } },
        { name: { contains: search, mode: insensitive } },
      ]),
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    // CRM Accounts
    const pAccounts = prismadb.crm_Accounts.findMany({
      where: getWhereClause([
        { description: { contains: search, mode: insensitive } },
        { name: { contains: search, mode: insensitive } },
        { email: { contains: search, mode: insensitive } },
      ]),
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    // CRM Contacts
    const pContacts = prismadb.crm_Contacts.findMany({
      where: getWhereClause([
        { last_name: { contains: search, mode: insensitive } },
        { first_name: { contains: search, mode: insensitive } },
        { email: { contains: search, mode: insensitive } },
      ]),
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    // CRM Leads
    const pLeads = prismadb.crm_Leads.findMany({
      where: getWhereClause([
        { lastName: { contains: search, mode: insensitive } },
        { firstName: { contains: search, mode: insensitive } },
        { email: { contains: search, mode: insensitive } },
        { company: { contains: search, mode: insensitive } },
      ]),
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    // CRM Contracts
    const pContracts = prismadb.crm_Contracts.findMany({
      where: getWhereClause([
        { title: { contains: search, mode: insensitive } },
        { description: { contains: search, mode: insensitive } },
      ]),
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    // Documents
    const pDocuments = prismadb.documents.findMany({
      where: getDocumentWhereClause([
        { document_name: { contains: search, mode: insensitive } },
        { description: { contains: search, mode: insensitive } },
      ]),
      take: 5,
      orderBy: { updatedAt: 'desc' },
    });

    // Invoices
    const pInvoices = prismadb.invoices.findMany({
      where: getInvoiceWhereClause([
        { invoice_number: { contains: search, mode: insensitive } },
        { description: { contains: search, mode: insensitive } },
        { partner: { contains: search, mode: insensitive } },
      ]),
      take: 5,
      orderBy: { last_updated: 'desc' }
    });

    // Tasks (Local)
    const pTasks = prismadb.tasks.findMany({
      where: getTaskWhereClause([
        { title: { contains: search, mode: insensitive } },
        { content: { contains: search, mode: insensitive } },
      ]),
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    // Projects (Boards)
    const projectsWhere = isSuperAdmin
      ? {
        OR: [
          { title: { contains: search, mode: insensitive } },
          { description: { contains: search, mode: insensitive } },
        ]
      }
      : {
        AND: [
          {
            OR: [
              { title: { contains: search, mode: insensitive } },
              { description: { contains: search, mode: insensitive } },
            ]
          },
          {
            OR: [
              { user: userId },
              { sharedWith: { has: userId } },
              ...(teamId ? [{ team_id: teamId }] : []),
            ]
          }
        ]
      };

    const pProjects = prismadb.boards.findMany({
      where: projectsWhere,
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    // Users
    // Generally, users can find other users in the system (colleagues). 
    // Safest Scoping: Same Team OR Admin.
    const usersWhere = isSuperAdmin
      ? {
        OR: [
          { email: { contains: search, mode: insensitive } },
          { name: { contains: search, mode: insensitive } },
          { username: { contains: search, mode: insensitive } },
        ]
      }
      : {
        AND: [
          {
            OR: [
              { email: { contains: search, mode: insensitive } },
              { name: { contains: search, mode: insensitive } },
              { username: { contains: search, mode: insensitive } },
            ]
          },
          // If user has a team, show only team members. 
          ...(teamId ? [{ team_id: teamId }] : [])
        ]
      };

    // If filtering by nothing (no team, scoped user), we might want to return empty or let it pass if query is empty
    // But here if teamId is null and user is not admin, usersWhere AND will have 1 condition (search text).
    // This allows searching global users if you have no team. Which is acceptable.

    const pUsers = prismadb.users.findMany({
      where: usersWhere,
      take: 5,
      orderBy: { name: 'asc' }
    });

    const [
      resultsCrmOpportunities,
      resultsCrmAccounts,
      resultsCrmContacts,
      resultsCrmLeads,
      resultsCrmContracts,
      resultsDocuments,
      resultsInvoices,
      resultsTasks,
      resultsProjects,
      resultsUsers
    ] = await Promise.all([
      pOpportunities,
      pAccounts,
      pContacts,
      pLeads,
      pContracts,
      pDocuments,
      pInvoices,
      pTasks,
      pProjects,
      pUsers
    ]);

    const data = {
      opportunities: resultsCrmOpportunities,
      accounts: resultsCrmAccounts,
      contacts: resultsCrmContacts,
      leads: resultsCrmLeads,
      contracts: resultsCrmContracts,
      documents: resultsDocuments,
      invoices: resultsInvoices,
      tasks: resultsTasks,
      projects: resultsProjects,
      users: resultsUsers,
    };

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.log("[FULLTEXT_SEARCH_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
