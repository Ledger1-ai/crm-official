import { prismadb } from "@/lib/prisma";

export type DashboardCounts = {
  leads: number;
  tasks: number;
  boards: number;
  contacts: number;
  accounts: number;
  contracts: number;
  invoices: number;
  documents: number;
  opportunities: number;
  users: number; // active users
  revenue: number; // expected revenue from ACTIVE opportunities
  storageMB: number; // total storage in MB (rounded to 2 decimals)
};

export const getSummaryCounts = async (): Promise<DashboardCounts> => {
  const [
    leads,
    tasks,
    boards,
    contacts,
    accounts,
    contracts,
    invoices,
    documents,
    opportunities,
    users,
    revenueAgg,
    storageAgg,
  ] = await prismadb.$transaction([
    prismadb.crm_Leads.count(),
    prismadb.tasks.count(),
    prismadb.boards.count(),
    prismadb.crm_Contacts.count(),
    prismadb.crm_Accounts.count(),
    prismadb.crm_Contracts.count(),
    prismadb.invoices.count(),
    prismadb.documents.count(),
    prismadb.crm_Opportunities.count(),
    prismadb.users.count({ where: { userStatus: "ACTIVE" as any } }),
    prismadb.crm_Opportunities.aggregate({ where: { status: "ACTIVE" as any }, _sum: { budget: true } }),
    prismadb.documents.aggregate({ _sum: { size: true } }),
  ]);

  const revenue = Number((revenueAgg as any)._sum?.budget ?? 0);
  const storageBytes = Number((storageAgg as any)._sum?.size ?? 0);
  const storageMB = Math.round((storageBytes / 1_000_000) * 100) / 100;

  return {
    leads,
    tasks,
    boards,
    contacts,
    accounts,
    contracts,
    invoices,
    documents,
    opportunities,
    users,
    revenue,
    storageMB,
  };
};
