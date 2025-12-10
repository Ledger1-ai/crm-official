import React from "react";
import Container from "../../components/ui/Container";
import { getTasks } from "@/actions/projects/get-tasks";
import { TasksDataTable } from "./components/data-table";
import { columns } from "./components/columns";
import { getActiveUsers } from "@/actions/get-users";
import { getBoards } from "@/actions/projects/get-boards";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import NewTaskDialog from "../dialogs/NewTask";

const TasksPage = async () => {
  const session = await getServerSession(authOptions);
  const tasks: any = await getTasks();
  const users = await getActiveUsers();
  const boards = session ? await getBoards(session.user.id!) : [];

  return (
    <Container
      title="All tasks"
      description={"Everything you need to know about tasks"}
    >
      <div className="flex gap-2 py-5">
        <NewTaskDialog users={users} boards={boards as any} />
        {session && (
          <Button asChild variant="outline">
            <Link href={`/projects/tasks/${session.user.id}`}>My Tasks</Link>
          </Button>
        )}
      </div>
      <div>
        <TasksDataTable data={tasks} columns={columns} />
      </div>
    </Container>
  );
};

export default TasksPage;
