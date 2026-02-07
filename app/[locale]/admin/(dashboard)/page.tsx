import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { prismadb } from "@/lib/prisma";
import { getCurrentUserTeamId } from "@/lib/team-utils";

import { Users, ShieldCheck, UserCheck, Eye, Building2, LayoutDashboard } from "lucide-react";

// UI Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InviteForm } from "@/app/[locale]/cms/(dashboard)/users/components/IviteForm";
import { AdminUserDataTable } from "@/app/[locale]/cms/(dashboard)/users/table-components/data-table";
import { columns } from "@/app/[locale]/cms/(dashboard)/users/table-components/columns";
import { getUsers } from "@/actions/get-users";
import SendMailToAll from "@/app/[locale]/cms/(dashboard)/users/components/send-mail-to-all";
import DepartmentsView from "@/app/[locale]/(routes)/partners/[teamId]/_components/DepartmentsView";

export default async function AdminDashboardPage({
  searchParams
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await getServerSession(authOptions);
  const teamInfo = await getCurrentUserTeamId();
  const activeTab = searchParams?.tab === 'departments' ? 'departments' : 'overview';

  if (!teamInfo?.teamId) {
    return (
      <Container title="Administration" description="No organization found.">
        <div className="p-4">You are not assigned to a team.</div>
      </Container>
    );
  }

  const teamId = teamInfo.teamId;

  // Fetch team-specific stats and departments
  const [rolesData, users, departments] = await Promise.all([
    prismadb.users.groupBy({
      by: ['team_role'],
      where: { team_id: teamId },
      _count: true,
    }),
    getUsers(),
    prismadb.team.findMany({
      where: {
        parent_id: teamId,
        team_type: "DEPARTMENT",
      } as any,
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            team_role: true,
            avatar: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: "asc" },
    })
  ]);

  const usersCount = users.length;
  const adminCount = rolesData.find(r => r.team_role === 'ADMIN')?._count ?? 0;
  const memberCount = rolesData.find(r => r.team_role === 'MEMBER' || r.team_role === null)?._count ?? 0;
  const viewerCount = rolesData.find(r => r.team_role === 'VIEWER')?._count ?? 0;

  const role = (teamInfo.teamRole || '').toUpperCase();
  const isSuperAdmin = teamInfo.isGlobalAdmin || ['SUPER_ADMIN', 'OWNER', 'PLATFORM_ADMIN', 'SYSADM', 'PLATFORM ADMIN'].includes(role);

  return (
    <Container
      title="Administration"
      description="Manage your Organization, invite new members, configure user access, and organize your team into departments."
      action={<SendMailToAll />}
      fluid
    >
      <Tabs defaultValue={activeTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Departments
            {departments.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                {departments.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 outline-none">
          {/* Quick Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Users" value={usersCount} icon={Users} />
            <StatCard label="Admins" value={adminCount} icon={ShieldCheck} />
            <StatCard label="Members" value={memberCount} icon={UserCheck} />
            <StatCard label="Viewers" value={viewerCount} icon={Eye} />
          </div>

          {/* Invite Section */}
          <div className="p-5 bg-card/50 border border-border rounded-xl">
            <h4 className="text-lg font-semibold mb-4">
              Invite New User
            </h4>
            <InviteForm />
          </div>

          {/* Users Table */}
          <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
            <div className="p-5 border-b border-border">
              <h4 className="text-lg font-semibold">All Users</h4>
              <p className="text-sm text-muted-foreground mt-1">
                Click the settings icon on any user row to configure their module access.
              </p>
            </div>
            <div className="p-4">
              <AdminUserDataTable columns={columns} data={users} departments={departments} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="departments" className="outline-none">
          <div className="bg-card/50 border border-border rounded-xl p-6">
            <DepartmentsView
              teamId={teamId}
              departments={departments as any}
              isSuperAdmin={isSuperAdmin}
            />
          </div>
        </TabsContent>
      </Tabs>
    </Container>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ label, value, icon: Icon }: StatCardProps) {
  return (
    <div className="p-4 bg-card/50 border border-border rounded-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-2.5 bg-primary/10 rounded-lg">
          <Icon className="w-5 h-5 text-primary" />
        </div>
      </div>
    </div>
  );
}

