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
import { Plus, Layout } from "lucide-react";

import { Button } from "@/components/ui/button";
import NewTaskDialog from "../dialogs/NewTask";
import { NavigationCard } from "@/components/NavigationCard";

const TasksPage = async () => {
  const session = await getServerSession(authOptions);
  const tasks: any = await getTasks();
  const users = await getActiveUsers();
  const boards = session ? await getBoards(session.user.id!) : [];

  const cards = [
    {
      title: "Create Task",
      description: "Add a new task to board",
      icon: Plus,
      color: "from-cyan-500/20 to-sky-500/20",
      iconColor: "text-cyan-400",
      type: "create"
    },
    {
      title: "My Tasks",
      description: "View my assigned tasks",
      icon: Layout,
      color: "from-violet-500/20 to-purple-500/20",
      iconColor: "text-violet-400",
      type: "link",
      href: `/projects/tasks/${session?.user.id}`
    }
  ];

  return (
    <Container
      title="All tasks"
      description={"Everything you need to know about tasks"}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 flex-shrink-0">
        <NewTaskDialog
          users={users}
          boards={boards as any}
          customTrigger={<NavigationCard card={cards[0]} />}
        />
        {session && (
          <Link href={cards[1].href!} className="block h-full">
            <NavigationCard card={cards[1]} />
          </Link>
        )}
      </div>
      <div>
        <TasksDataTable data={tasks} columns={columns} />
      </div>
    </Container>
  );
};

export default TasksPage;
