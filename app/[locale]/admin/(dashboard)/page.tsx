import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { prismadb } from "@/lib/prisma";

import TeamAiSettingsCompact from "./components/TeamAiSettingsCompact";
import ResendCard from "@/app/[locale]/cms/(dashboard)/_components/ResendCard";
import { Users, ShieldCheck, UserCheck, Eye, Bot, Mail } from "lucide-react";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);

  const user = await prismadb.users.findUnique({
    where: { email: session?.user?.email || "" },
    include: { assigned_team: true }
  });

  const teamId = user?.assigned_team?.id;

  // Fetch quick stats
  const [usersCount, rolesData] = await Promise.all([
    prismadb.users.count(),
    prismadb.users.groupBy({
      by: ['team_role'],
      _count: true,
    }),
  ]);

  const adminCount = rolesData.find(r => r.team_role === 'ADMIN')?._count ?? 0;
  const memberCount = rolesData.find(r => r.team_role === 'MEMBER' || r.team_role === null)?._count ?? 0;
  const viewerCount = rolesData.find(r => r.team_role === 'VIEWER')?._count ?? 0;

  return (
    <Container
      title="Administration"
      description="Manage your BasaltCRM instance settings, users, and AI configuration."
    >
      <div className="space-y-6">
        {/* Quick Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={usersCount} icon={Users} />
          <StatCard label="Admins" value={adminCount} icon={ShieldCheck} />
          <StatCard label="Members" value={memberCount} icon={UserCheck} />
          <StatCard label="Viewers" value={viewerCount} icon={Eye} />
        </div>

        {/* AI Configuration - Horizontal Layout */}
        <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-border">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">AI Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure your team's AI provider, model, and authentication.
              </p>
            </div>
          </div>
          <div className="p-5">
            {teamId ? (
              <TeamAiSettingsCompact teamId={teamId} />
            ) : (
              <div className="p-4 border rounded bg-muted/20 text-muted-foreground text-center">
                No Team Assigned. Cannot configure AI.
              </div>
            )}
          </div>
        </div>

        {/* Email Configuration - Full Width Below */}
        <div className="bg-card/50 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 p-5 border-b border-border">
            <div className="p-2.5 bg-primary/10 rounded-lg">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Email Configuration</h3>
              <p className="text-sm text-muted-foreground">
                Configure email sending via Resend.
              </p>
            </div>
          </div>
          <div className="p-5">
            <ResendCard />
          </div>
        </div>
      </div>
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
