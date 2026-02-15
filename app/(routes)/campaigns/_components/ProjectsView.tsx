import React from "react";
import { getServerSession } from "next-auth";

import { getActiveUsers } from "@/actions/get-users";
import { getBoards } from "@/actions/campaigns/get-boards";
import { getProjectStats } from "@/actions/campaigns/get-project-stats";

import { authOptions } from "@/lib/auth";

import NewTaskDialog from "../dialogs/NewTask";
import NewProjectDialog from "../dialogs/NewProject";

import { ProjectsDataTable } from "../table-components/data-table";
import { columns } from "../table-components/columns";
import { FolderPlus, CheckSquare } from "lucide-react";
import { ProjectCard, ProjectCardData } from "./ProjectCard";
import AiAssistantCardWrapper from "./AiAssistantCardWrapper";

const ProjectsView = async () => {
  const session = await getServerSession(authOptions);

  if (!session) return null;

  const users = await getActiveUsers();
  const boards: any = await getBoards(session.user.id!);
  const stats = await getProjectStats();

  // We only define data for the first two cards here as AiAssistantCardWrapper handles its own card data
  const cards: ProjectCardData[] = [
    {
      title: "New Campaign",
      description: "Create a new campaign board",
      icon: FolderPlus,
      color: "from-emerald-500/20 to-green-500/20",
      iconColor: "text-emerald-400"
    },
    {
      title: "New Task",
      description: "Add a task to a campaign",
      icon: CheckSquare,
      color: "from-orange-500/20 to-red-500/20",
      iconColor: "text-orange-400"
    }
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 flex-shrink-0 sticky top-0 z-40 pb-4 pt-4 -mt-4">
        <NewProjectDialog
          customTrigger={<ProjectCard card={cards[0]} />}
        />
        <NewTaskDialog
          users={users}
          boards={boards}
          customTrigger={<ProjectCard card={cards[1]} />}
        />
        <AiAssistantCardWrapper session={session} />
      </div>
      <div className="pt-2 space-y-3">
        <ProjectsDataTable data={boards} columns={columns} stats={stats} />
      </div>
    </>
  );
};

export default ProjectsView;
