import React from "react";
import { getServerSession } from "next-auth";

import { getActiveUsers } from "@/actions/get-users";
import { getBoards } from "@/actions/projects/get-boards";

import { authOptions } from "@/lib/auth";

import NewTaskDialog from "../dialogs/NewTask";
import NewProjectDialog from "../dialogs/NewProject";


import H2Title from "@/components/typography/h2";

import { ProjectsDataTable } from "../table-components/data-table";
import { columns } from "../table-components/columns";
import AiAssistant from "./AiAssistant";

const ProjectsView = async () => {
  const session = await getServerSession(authOptions);

  if (!session) return null;



  const users = await getActiveUsers();
  const boards: any = await getBoards(session.user.id!);

  return (
    <>
      <div className="flex gap-2 py-10">
        <NewProjectDialog />
        <NewTaskDialog users={users} boards={boards} />
        <AiAssistant session={session} />
      </div>
      <div className="pt-2 space-y-3">
        <H2Title>Projects</H2Title>
        <ProjectsDataTable data={boards} columns={columns} />
      </div>
    </>
  );
};

export default ProjectsView;
