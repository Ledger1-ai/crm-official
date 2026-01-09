import React from "react";
import Container from "../../components/ui/Container";
import DashboardNavGrid from "./_components/DashboardNavGrid";
import WelcomeMessage from "./_components/WelcomeMessage";
import JumpBackIn from "./_components/JumpBackIn";
import DailyTasksWidget from "./_components/DailyTasksWidget";
import MyLeadsWidget from "./_components/MyLeadsWidget";
import NewProjectsWidget from "./_components/NewProjectsWidget";
import { getDailyTasks } from "@/actions/dashboard/get-daily-tasks";
import { getNewLeads } from "@/actions/dashboard/get-new-leads";
import { getNewProjects } from "@/actions/dashboard/get-new-projects";
import { getUserMessages } from "@/actions/dashboard/get-user-messages";
import MessagesWidget from "./_components/MessagesWidget";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const CrmDashboardPage = async () => {
  const dailyTasks = await getDailyTasks();
  const newLeads = await getNewLeads();
  const newProjects = await getNewProjects();
  const messages = await getUserMessages();

  const session = await getServerSession(authOptions);
  let isMember = false;

  if (session?.user?.id) {
    const user = await prismadb.users.findUnique({
      where: { id: session.user.id },
      select: { team_role: true }
    });
    isMember = user?.team_role === "MEMBER";
  }

  return (
    <Container>
      <div className="flex flex-col space-y-2 mt-4">
        {/* Welcome Section & Active Widgets */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-4">
          <WelcomeMessage />
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
            <MyLeadsWidget leads={newLeads} />
            <NewProjectsWidget projects={newProjects} />
            <DailyTasksWidget tasks={dailyTasks} />
            <MessagesWidget messages={messages} />
          </div>
        </div>

        {/* Recent Activity / Jump Back In */}
        <JumpBackIn />

        {/* Main Navigation Grid */}
        <DashboardNavGrid isMember={isMember} />
      </div>
    </Container>
  );
};

export default CrmDashboardPage;
