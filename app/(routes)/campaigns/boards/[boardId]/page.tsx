import { getBoard } from "@/actions/campaigns/get-board";
import React, { Suspense } from "react";

import NewSectionDialog from "./dialogs/NewSection";

import NewTaskInProjectDialog from "./dialogs/NewTaskInProject";
import { getActiveUsers } from "@/actions/get-users";
import { getBoardSections } from "@/actions/campaigns/get-board-sections";
import DeleteProjectDialog from "./dialogs/DeleteProject";
import { getKanbanData } from "@/actions/campaigns/get-kanban-data";
import Kanban from "./components/Kanban";
import Gantt from "./components/Gantt";

import ProjectEditPanel from "./components/ProjectEditPanel";
import ProjectDocumentsPanel from "./components/ProjectDocumentsPanel";
import { getBoards } from "@/actions/campaigns/get-boards";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Users } from "@prisma/client";
import AiAssistantProject from "./components/AiAssistantProject";
import { Lock } from "lucide-react";
import BoardTabsContainer from "./components/BoardTabsContainer";
import ProjectMembersPanel from "./components/ProjectMembersPanel";
import { prismadb } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface BoardDetailProps {
  params: Promise<{ boardId: string }>;
}

export const maxDuration = 300;

const BoardPage = async (props: BoardDetailProps) => {
  const params = await props.params;
  const session = await getServerSession(authOptions);
  const user = session?.user;

  // Role-based access check: Members cannot access individual board pages
  if (user?.id) {
    const userData = await prismadb.users.findUnique({
      where: { id: user.id },
      select: {
        team_role: true,
        is_admin: true,
        is_account_admin: true,
        assigned_role: { select: { name: true } }
      }
    });

    const isSuperAdmin = userData?.assigned_role?.name === "SuperAdmin";
    const isAdmin = userData?.is_admin || userData?.is_account_admin;

    // Members are redirected to their My Campaigns page
    if (!isSuperAdmin && !isAdmin) {
      return redirect("/crm/my-campaigns");
    }
  }

  const { boardId } = params;
  const board: any = await getBoard(boardId);
  const boards = await getBoards(user?.id!);
  const users: Users[] = await getActiveUsers();
  const sections: any = await getBoardSections(boardId);
  const kanbanData = await getKanbanData(boardId);


  // fetch brand logo for hero header
  let brandLogoUrl: string | null = null;
  try {
    const brandRes = await fetch(`/api/campaigns/${boardId}/brand`, { cache: 'no-store' as any });
    if (brandRes.ok) {
      const bj = await brandRes.json().catch(() => null);
      brandLogoUrl = bj?.brand_logo_url || null;
    }
  } catch { }

  //console.log(board, "board");
  return (
    <div className="h-full w-full">
      <BoardTabsContainer
        title={board?.board?.title}
        description={board?.board?.description}
        visibility={board?.board?.visibility}
        headerSlot={
          brandLogoUrl ? (
            <img
              src={brandLogoUrl}
              alt="Project Logo"
              className="h-16 w-16 rounded-xl border object-contain shadow-sm bg-background"
            />
          ) : null
        }
        kanbanSlot={
          <>
            <div className="flex items-center justify-between py-2 w-full">
              <div className="space-x-2">
                <NewSectionDialog boardId={boardId} />
                <NewTaskInProjectDialog
                  boardId={boardId}
                  users={users}
                  sections={sections}
                />
                <AiAssistantProject session={session} boardId={boardId} />
              </div>
            </div>
            <Kanban
              data={kanbanData.sections}
              boardId={boardId}
              boards={boards}
              users={users}
            />
          </>
        }
        ganttSlot={
          <>
            <div className="flex items-center justify-between py-2 w-full">
              <div className="space-x-2"></div>
            </div>
            <Gantt data={kanbanData.sections as any} />
          </>
        }
        documentsSlot={
          <ProjectDocumentsPanel boardId={boardId} />
        }
        membersSlot={
          <ProjectMembersPanel boardId={boardId} />
        }
        settingsSlot={
          <>
            <div className="mb-6">
              <ProjectEditPanel boardId={boardId} />
            </div>
            <div className="flex items-center justify-between py-5 w-full">
              <div />
              <div>
                <DeleteProjectDialog
                  boardId={boardId}
                  boardName={board.board.title}
                />
              </div>
            </div>
          </>
        }
      />
    </div>
  );
};

export default BoardPage;
