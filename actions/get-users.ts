import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

//Get all users for admin module (Scoped to Team)
export const getUsers = async () => {
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();
  const teamId = teamInfo?.teamId;

  // If super admin, maybe allow seeing all? 
  // But user request specifically asked for "users listed on your team".
  // So strictly filtering by team seems correct for this context.

  if (!teamId) return [];

  const data = await (prismadb.users as any).findMany({
    where: {
      team_id: teamId,
    },
    orderBy: {
      created_on: "desc",
    },
  });
  return data;
};

//Get active users for Selects in app etc
export const getActiveUsers = async () => {
  const data = await prismadb.users.findMany({
    orderBy: {
      created_on: "desc",
    },
    where: {
      userStatus: "ACTIVE",
    },
  });
  return data;
};

//Get new users by month for chart
export const getUsersByMonthAndYear = async (year: number) => {
  const users = await prismadb.users.findMany({
    select: {
      created_on: true,
    },
  });

  if (!users) {
    return {};
  }

  const usersByMonth = users.reduce((acc: any, user: any) => {
    const yearCreated = new Date(user.created_on).getFullYear();
    const month = new Date(user.created_on).toLocaleString("default", {
      month: "long",
    });

    if (yearCreated === year) {
      acc[month] = (acc[month] || 0) + 1;
    }

    return acc;
  }, {});

  const chartData = Object.keys(usersByMonth).map((month: any) => {
    return {
      name: month,
      Number: usersByMonth[month],
    };
  });

  return chartData;
};

//Get new users by month for chart
export const getUsersByMonth = async () => {
  const users = await prismadb.users.findMany({
    select: {
      created_on: true,
    },
  });

  if (!users) {
    return {};
  }

  const usersByMonth = users.reduce((acc: any, user: any) => {
    const month = new Date(user.created_on).toLocaleString("default", {
      month: "long",
    });

    acc[month] = (acc[month] || 0) + 1;

    return acc;
  }, {});

  const chartData = Object.keys(usersByMonth).map((month: any) => {
    return {
      name: month,
      Number: usersByMonth[month],
    };
  });

  return chartData;
};

export const getUsersCountOverall = async () => {
  const users = await prismadb.users.findMany({
    select: {
      created_on: true,
    },
  });

  if (!users) {
    return {};
  }

  const usersByMonth = users.reduce((acc: any, user: any) => {
    const date = new Date(user.created_on);
    const yearMonth = `${date.getFullYear()}-${date.getMonth() + 1}`;

    acc[yearMonth] = (acc[yearMonth] || 0) + 1;

    return acc;
  }, {});

  const chartData = Object.keys(usersByMonth).map((yearMonth: any) => {
    const [year, month] = yearMonth.split("-");
    return {
      year: parseInt(year),
      month: parseInt(month),
      name: `${month}/${year}`,
      Number: usersByMonth[yearMonth],
    };
  });

  return chartData;
};
