import { prismadb } from "@/lib/prisma";

export const getExpectedRevenue = async () => {
  const agg = await prismadb.crm_Opportunities.aggregate({
    where: { status: "ACTIVE" },
    _sum: { budget: true },
  });
  return Number(agg._sum.budget ?? 0);
};
