import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const getLeads = async () => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return [];
  }

  // Get user to check admin status
  const user = await prismadb.users.findUnique({
    where: { id: session.user.id },
    select: { is_admin: true, is_account_admin: true },
  });

  // Admins see all leads, regular users see only their assigned leads
  const whereClause = (user?.is_admin || user?.is_account_admin) 
    ? {}
    : { assigned_to: session.user.id };

  const data = await prismadb.crm_Leads.findMany({
    where: whereClause,
    include: {
      assigned_to_user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return data;
};
