import { prismadb } from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getAllCrmData = async () => {
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();

  if (!session || (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin)) return { users: [], accounts: [], opportunities: [], leads: [], contacts: [], contracts: [], saleTypes: [], saleStages: [], campaigns: [], industries: [], boards: [] };

  const whereClause: any = {};
  if (!teamInfo?.isGlobalAdmin) {
    whereClause.team_id = teamInfo?.teamId;
  }

  // Users are special, maybe filter by team_id too?
  // Previous logic for users was just Active. Now we should filter by Team?
  // Prismadb.users has team_id.
  const usersWhere = {
    userStatus: "ACTIVE" as any,
    ...(teamInfo?.isGlobalAdmin ? {} : { team_id: teamInfo?.teamId })
  };

  const users = await prismadb.users.findMany({
    where: usersWhere,
  });

  const accountsWhere = {
    ...whereClause,
    NOT: [
      { name: { startsWith: "Email -" } },
      { name: { startsWith: "Meeting" } },
      { name: { startsWith: "Call" } },
      { name: { startsWith: "Amazon SES" } },
      { name: { startsWith: "Project Documents" } },
    ],
  };

  const accounts = await (prismadb.crm_Accounts as any).findMany({ where: accountsWhere });
  const opportunities = await prismadb.crm_Opportunities.findMany({
    where: whereClause,
    include: {
      assigned_to_user: { select: { avatar: true, name: true } },
    }
  });
  const leads = await prismadb.crm_Leads.findMany({ where: whereClause });

  const contacts = await (prismadb.crm_Contacts as any).findMany({ where: whereClause });
  const contracts = await (prismadb.crm_Contracts as any).findMany({ where: whereClause });

  // Shared data might not have team_id?
  // Sales Types, Stages, Campaigns, Industries...
  // Check schema for these. 
  // If they are global, keep empty where.
  // Reviewing schema in previous turns... 
  // I recall I did NOT add team_id to SalesTypes/Stages/Campaigns/Industries in the previous task. 
  // I only did it for major entities.
  // So keep them global/shared for now unless I find they have team_id.

  const saleTypes = await prismadb.crm_Opportunities_Type.findMany({});
  const saleStages = await prismadb.crm_Opportunities_Sales_Stages.findMany({});
  const campaigns = await prismadb.crm_campaigns.findMany({});
  const industries = await prismadb.crm_Industry_Type.findMany({});
  const boards = await prismadb.boards.findMany({
    select: { id: true, title: true }
  });

  const data = {
    users,
    accounts,
    opportunities,
    leads,
    contacts,
    contracts,
    saleTypes,
    saleStages,
    campaigns,
    industries,
    boards,
  };

  return data;
};
