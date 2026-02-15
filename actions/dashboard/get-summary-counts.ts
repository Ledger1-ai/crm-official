import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export type DashboardCounts = {
  leads: number;
  tasks: number;
  boards: number;
  contacts: number;
  accounts: number;
  contracts: number;
  invoices: number;
  documents: number;
  opportunities: number; // Combined: CRM + Project opportunities
  users: number; // active users
  revenue: number; // Projected Revenue (All Invoices)
  actualRevenue: number; // Actual Revenue (Paid Invoices)
  storageMB: number; // total storage in MB (rounded to 2 decimals)
};

export const getSummaryCounts = async (): Promise<DashboardCounts> => {
  // Get team context for filtering
  const teamInfo = await getCurrentUserTeamId();
  console.log('[getSummaryCounts] teamInfo:', teamInfo);
  const teamId = teamInfo?.teamId;
  const isGlobalAdmin = teamInfo?.isGlobalAdmin;

  // Build team filter - global admins see all, others see only their team
  const teamRole = teamInfo?.teamRole;
  const assignmentsFilter = teamRole === "MEMBER" ? {
    OR: [
      { assigned_to: teamInfo?.userId },
      { user: teamInfo?.userId } // For models using 'user' instead of 'assigned_to'
    ]
  } : {};

  // Helper to merge team filter with member restriction
  const getFilter = (modelField: "assigned_to" | "user" | "none" = "none") => {
    let base = isGlobalAdmin ? {} : teamId ? { team_id: teamId } : { team_id: "no-team-fallback" };

    if (teamRole === "MEMBER") {
      if (modelField === "assigned_to") {
        return { ...base, assigned_to: teamInfo?.userId };
      } else if (modelField === "user") {
        return { ...base, user: teamInfo?.userId };
      }
    }
    return base;
  };

  // For documents: members see only their assigned or created docs
  const getDocumentFilter = () => {
    if (isGlobalAdmin) return {};
    const base = teamId ? { team_id: teamId } : { team_id: "no-team-fallback" };
    if (teamRole === "MEMBER") {
      return {
        ...base,
        OR: [
          { created_by_user: teamInfo?.userId },
          { assigned_user: teamInfo?.userId }
        ]
      };
    }
    return base;
  };

  // For project opportunities: members see only their created/assigned ones
  const getProjectOpportunityFilter = () => {
    if (teamRole === "MEMBER") {
      return {
        status: "OPEN",
        OR: [
          { createdBy: teamInfo?.userId },
          { assignedTo: teamInfo?.userId }
        ]
      };
    }
    return { status: "OPEN" };
  };

  const getAccountFilter = () => {
    const base = getFilter("assigned_to");
    return {
      ...base,
      NOT: [
        { name: { startsWith: "Email -" } },
        { name: { startsWith: "Meeting" } },
        { name: { startsWith: "Call" } },
        { name: { startsWith: "Amazon SES" } },
        { name: { startsWith: "Project Documents" } },
      ]
    };
  };

  const [
    leads,
    tasks,
    boards,
    contacts,
    accounts,
    contracts,
    invoices,
    documents,
    crmOpportunities,
    projectOpportunities,
    users,
    crmRevenueAgg,
    projectRevenueAgg,
    storageAgg,
  ] = await Promise.all([
    prismadb.crm_Leads.count({ where: getFilter("assigned_to") }),
    prismadb.tasks.count({ where: getFilter("user") }),
    prismadb.boards.count({ where: getFilter("user") }),
    prismadb.crm_Contacts.count({ where: getFilter("assigned_to") }),
    prismadb.crm_Accounts.count({ where: getAccountFilter() }),
    prismadb.crm_Contracts.count({ where: getFilter("assigned_to") }),
    // Fetch all invoices with amount and status for revenue calculation
    prismadb.invoices.findMany({
      where: isGlobalAdmin ? {} : teamId ? { team_id: teamId } : { team_id: "no-team-fallback" },
      select: { invoice_amount: true, payment_status: true }
    }),
    prismadb.documents.count({ where: getDocumentFilter() }), // Member-specific document filter
    // Count CRM Opportunities
    prismadb.crm_Opportunities.count({ where: getFilter("assigned_to") }),
    // Count Project Opportunities - now filtered for members
    (prismadb.project_Opportunities as any).count({ where: getProjectOpportunityFilter() }),
    // Users: members see "1" (themselves), admins see team count
    prismadb.users.count({
      where: teamRole === "MEMBER"
        ? { id: teamInfo?.userId }
        : { ...(isGlobalAdmin ? {} : teamId ? { team_id: teamId } : { team_id: "no-team-fallback" }), userStatus: "ACTIVE" as any }
    }),
    // CRM Opportunities expected revenue (already filtered for members)
    prismadb.crm_Opportunities.aggregate({
      where: { ...getFilter("assigned_to"), status: "ACTIVE" as any },
      _sum: { expected_revenue: true }
    }),
    // Project Opportunities value estimate - now filtered for members
    (prismadb.project_Opportunities as any).aggregate({
      where: getProjectOpportunityFilter(),
      _sum: { valueEstimate: true }
    }),
    prismadb.documents.aggregate({ where: getDocumentFilter(), _sum: { size: true } }),
  ]);

  // Combine opportunities from both CRM and Project systems
  // UPDATE: User requested separation. ONLY Sales Pipeline counts as official "Opportunities" and "Revenue".
  // Project Requests are just internal tasks.
  const opportunities = crmOpportunities;

  // Combine revenue from both CRM opportunities and Project opportunities
  const crmRevenue = Number((crmRevenueAgg as any)._sum?.expected_revenue ?? 0);
  const projectRevenue = Number((projectRevenueAgg as any)._sum?.valueEstimate ?? 0);

  // Calculate Invoice-based Revenue
  let projectedRevenue = 0;
  let actualRevenue = 0;

  if (Array.isArray(invoices)) {
    (invoices as any[]).forEach((inv) => {
      const amount = parseFloat((inv.invoice_amount || "0").replace(/[^0-9.-]+/g, ""));
      if (!isNaN(amount)) {
        projectedRevenue += amount;
        if (inv.payment_status === "PAID") {
          actualRevenue += amount;
        }
      }
    });
  }

  const revenue = projectedRevenue;
  const invoicesCount = Array.isArray(invoices) ? invoices.length : 0;

  const storageBytes = Number((storageAgg as any)._sum?.size ?? 0);
  const storageMB = Math.round((storageBytes / 1_000_000) * 100) / 100;

  return {
    leads,
    tasks,
    boards,
    contacts,
    accounts,
    contracts,
    invoices: invoicesCount,
    documents,
    opportunities,
    users,
    revenue, // Projected
    actualRevenue, // Actual
    storageMB,
  };
};
