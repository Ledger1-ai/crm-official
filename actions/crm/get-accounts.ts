import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getAccounts = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return [];

  const teamInfo = await getCurrentUserTeamId();
  if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return [];

  const whereClause: any = {};
  if (!teamInfo?.isGlobalAdmin) {
    whereClause.team_id = teamInfo?.teamId;
  }

  // Filter out tasks/events that might be incorrectly stored as accounts
  whereClause.NOT = [
    { name: { startsWith: "Email -" } },
    { name: { startsWith: "Meeting" } },
    { name: { startsWith: "Call" } },
    { name: { startsWith: "Amazon SES" } },
    { name: { startsWith: "Project Documents" } },
  ];

  const data = await (prismadb.crm_Accounts as any).findMany({
    where: whereClause,
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
      contacts: {
        select: {
          first_name: true,
          last_name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
};
