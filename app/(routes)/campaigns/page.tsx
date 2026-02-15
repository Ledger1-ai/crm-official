import React, { Suspense } from "react";
import Container from "../components/ui/Container";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Session } from "next-auth";

import ProjectsView from "./_components/ProjectsView";
import SuspenseLoading from "@/components/loadings/suspense";
import { prismadb } from "@/lib/prisma";

export const maxDuration = 300;

const ProjectsPage = async () => {
  const session: Session | null = await getServerSession(authOptions);

  if (!session) return redirect("/sign-in");

  // Check if user is admin (team level) or super admin (platform level)
  const user = await prismadb.users.findUnique({
    where: { id: session.user.id },
    select: {
      is_admin: true,
      is_account_admin: true,
      assigned_role: { select: { name: true } },
    },
  });

  const isSuperAdmin = user?.assigned_role?.name === "SuperAdmin";
  const isAdmin = user?.is_admin || user?.is_account_admin;

  // Only admins and super admins can access the full projects page
  // Members are redirected to their assigned projects view
  if (!isSuperAdmin && !isAdmin) {
    return redirect("/crm/my-campaigns");
  }

  return (
    <Container
      title="Campaigns"
      description={"Everything you need to know about campaigns"}
    >
      <Suspense fallback={<SuspenseLoading />}>
        <ProjectsView />
      </Suspense>
    </Container>
  );
};

export default ProjectsPage;
