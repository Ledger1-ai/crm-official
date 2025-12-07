import { prismadb } from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getDocuments = async () => {
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();
  if (!session || (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin)) return [];

  const whereClause: any = {};
  if (!teamInfo?.isGlobalAdmin) {
    whereClause.team_id = teamInfo?.teamId;
  }

  const data = await (prismadb.documents as any).findMany({
    where: whereClause,
    include: {
      created_by: {
        select: {
          name: true,
        },
      },
      assigned_to_user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date_created: "desc",
    },
  });
  return data;
};
