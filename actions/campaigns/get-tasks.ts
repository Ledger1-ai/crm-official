"use server";

import { authOptions } from "@/lib/auth";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";

export const getTasks = async () => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  const boards = await prismadb.boards.findMany({
    where: {
      OR: [
        {
          user: userId,
        },
        {
          visibility: "public",
        },
      ],
    },
    include: {
      assigned_user: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!boards || boards.length === 0) return [];
  if (!userId) return null;

  //Filtering tasks by section and board
  const sections = await prismadb.sections.findMany({
    where: {
      board: {
        in: boards.map((b) => b.id)
      }
    },
  });

  if (!sections || sections.length === 0) return [];

  const data = await prismadb.tasks.findMany({
    where: {
      section: {
        in: sections.map((s) => s.id)
      }
    },
    include: {
      assigned_user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return data;
};

//get tasks by month for chart
export const getTasksByMonth = async (startDate?: Date, endDate?: Date, departmentId?: string) => {
  const whereClause: any = {};

  if (startDate && endDate) {
    whereClause.createdAt = {
      gte: startDate,
      lte: endDate,
    };
  }

  const tasks = await prismadb.tasks.findMany({
    where: whereClause,
    select: {
      createdAt: true,
      assigned_user: {
        select: {
          department_id: true
        }
      }
    },
  });

  if (!tasks) {
    return [];
  }

  // Filter by department if needed
  let filteredTasks = tasks;
  if (departmentId && departmentId !== "all") {
    filteredTasks = tasks.filter((t: any) => t.assigned_user?.department_id === departmentId);
  }

  const tasksByMonth = filteredTasks.reduce((acc: any, task: any) => {
    const month = new Date(task.createdAt).toLocaleString("default", {
      month: "long",
    });
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.keys(tasksByMonth).map((month: any) => {
    return {
      name: month,
      Number: tasksByMonth[month],
    };
  });

  return chartData;
};
