"use server";

import { prismadb } from "@/lib/prisma";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCurrentUserTeamId } from "@/lib/team-utils";

export const getOpportunities = async () => {
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();

  if (!session || (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin)) return [];

  const whereClause: any = {};
  if (!teamInfo?.isGlobalAdmin) {
    whereClause.team_id = teamInfo?.teamId;
  }

  const data = await prismadb.crm_Opportunities.findMany({
    where: whereClause,
    include: {
      assigned_to_user: {
        select: {
          avatar: true,
          name: true,
        },
      },
    },
  });
  return data;
};

//Get opportunities by month for chart
export const getOpportunitiesByMonth = async (startDate?: Date, endDate?: Date, departmentId?: string) => {
  const teamInfo = await getCurrentUserTeamId();
  if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return [];

  const whereClause: any = {};
  if (!teamInfo?.isGlobalAdmin) {
    whereClause.team_id = teamInfo?.teamId;
  }
  if (teamInfo?.teamRole === "MEMBER" || teamInfo?.teamRole === "VIEWER") {
    whereClause.assigned_to = teamInfo?.userId;
  }

  // Filter by Department
  if (departmentId && departmentId !== "all") {
    whereClause.assigned_department_id = departmentId;
  }

  // Add Dynamic Date Range
  if (startDate && endDate) {
    whereClause.created_on = {
      gte: startDate,
      lte: endDate,
    };
  }

  const opportunities = await prismadb.crm_Opportunities.findMany({
    where: whereClause,
    select: {
      created_on: true,
    },
  });

  if (!opportunities) {
    return [];
  }

  const opportunitiesByMonth = opportunities.reduce(
    (acc: any, opportunity: any) => {
      const month = new Date(opportunity.created_on).toLocaleString("default", {
        month: "long",
      });
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    },
    {}
  );

  const chartData = Object.keys(opportunitiesByMonth).map((month: any) => {
    return {
      name: month,
      Number: opportunitiesByMonth[month],
    };
  });

  return chartData;
};

//Get opportunities by sales_stage name for chart
export const getOpportunitiesByStage = async () => {
  const teamInfo = await getCurrentUserTeamId();
  if (!teamInfo?.teamId && !teamInfo?.isGlobalAdmin) return {};

  const whereClause: any = {};
  if (!teamInfo?.isGlobalAdmin) {
    whereClause.team_id = teamInfo?.teamId;
  }
  if (teamInfo?.teamRole === "MEMBER" || teamInfo?.teamRole === "VIEWER") {
    whereClause.assigned_to = teamInfo?.userId;
  }

  const opportunities = await prismadb.crm_Opportunities.findMany({
    where: whereClause,
    select: {
      assigned_sales_stage: {
        select: {
          name: true,
        },
      },
    },
  });

  console.log(opportunities, "opportunities");
  if (!opportunities) {
    return {};
  }

  const opportunitiesByStage = opportunities.reduce(
    (acc: any, opportunity: any) => {
      const stage = opportunity.assigned_sales_stage?.name;
      acc[stage] = (acc[stage] || 0) + 1;
      return acc;
    },
    {}
  );

  const chartData = Object.keys(opportunitiesByStage).map((stage: any) => {
    return {
      name: stage,
      Number: opportunitiesByStage[stage],
    };
  });

  return chartData;
};
