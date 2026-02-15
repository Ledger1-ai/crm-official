import React from "react";
import Container from "../../components/ui/Container";
import ProjectDashboardCockpit from "./components/ProjectDasboard";
import { getTasksPastDue } from "@/actions/campaigns/get-tasks-past-due";
import { getActiveUsers } from "@/actions/get-users";
import { getBoards } from "@/actions/campaigns/get-boards";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSections } from "@/actions/campaigns/get-sections";
import { Sections } from "@prisma/client";
import NewTaskDialog from "../dialogs/NewTask";
import NewProjectDialog from "../dialogs/NewProject";

const ProjectDashboard = async () => {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  const dashboardData: any = await getTasksPastDue();
  const activeUsers: any = await getActiveUsers();
  const boards = await getBoards(user?.id!);
  const sections: Sections[] = await getSections();

  if (!dashboardData) {
    return <div>DashBoard data not found</div>;
  }

  return (
    <Container
      title="Dashboard"
      description={
        "Welcome to BasaltCRM cockpit, here you can see your company overview"
      }
    >
      <div className="flex gap-2 py-5">
        <NewProjectDialog />
        <NewTaskDialog users={activeUsers} boards={boards as any} />
      </div>
      <ProjectDashboardCockpit
        dashboardData={dashboardData}
        users={activeUsers}
        boards={boards}
        sections={sections}
      />
    </Container>
  );
};

export default ProjectDashboard;
