import { getTask } from "@/actions/campaigns/get-task";
import { getUserTasks } from "@/actions/campaigns/get-user-tasks";
import Container from "@/app/(routes)/components/ui/Container";
import React from "react";
import { TasksDataTable } from "../components/data-table";
import { columns } from "../components/columns";
import { Session, getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type TaskDetailPageProps = {
  params: Promise<{
    userId: string;
    username: string;
  }>;
};

const TaskDetailPage = async (props: TaskDetailPageProps) => {
  const params = await props.params;
  const session: Session | null = await getServerSession(authOptions);
  const { userId } = params;

  const tasks: any = await getUserTasks(userId);

  return (
    <Container
      title={`${session?.user.name}'s Tasks`}
      description={"Everything you need to know about tasks"}
    >
      <div className="flex gap-2 py-5">
        <Button asChild variant="outline">
          <Link href="/campaigns/tasks">All Tasks</Link>
        </Button>
      </div>
      <TasksDataTable data={tasks} columns={columns} />
    </Container>
  );
};

export default TaskDetailPage;
