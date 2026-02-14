import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/(routes)/components/ui/Container";
import { prismadb } from "@/lib/prisma";

import { Users, ShieldCheck, UserCheck, Eye } from "lucide-react";

// Users Components
import { InviteForm } from "@/app/cms/(dashboard)/users/components/IviteForm";
import { AdminUserDataTable } from "@/app/cms/(dashboard)/users/table-components/data-table";
import { columns } from "@/app/cms/(dashboard)/users/table-components/columns";
import { getUsers } from "@/actions/get-users";
import SendMailToAll from "@/app/cms/(dashboard)/users/components/send-mail-to-all";
import AdminDashboardLayout from "./(dashboard)/layout";

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    const user = await prismadb.users.findUnique({
        where: { email: session?.user?.email || "" },
        include: { assigned_team: true }
    });

    const teamId = user?.team_id || user?.assigned_team?.id;

    // Fetch team-specific stats
    const [rolesData, users, departments] = await Promise.all([
        prismadb.users.groupBy({
            by: ['team_role'],
            where: { team_id: teamId },
            _count: true,
        }),
        getUsers(), // Fetches users for current team context
        prismadb.team.findMany({
            where: {
                parent_id: teamId,
                team_type: 'DEPARTMENT'
            },
            select: { id: true, name: true }
        })
    ]);

    const usersCount = users.length;
    const adminCount = rolesData.find(r => r.team_role === 'ADMIN')?._count ?? 0;
    const memberCount = rolesData.find(r => r.team_role === 'MEMBER' || r.team_role === null)?._count ?? 0;
    const viewerCount = rolesData.find(r => r.team_role === 'VIEWER')?._count ?? 0;

    const pageContent = (
        <Container
            title="Administration"
            description="Manage your BasaltCRM instance, invite new members, and configure user access."
            action={<SendMailToAll />}
            fluid
        >
            <div className="space-y-6">
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
            </div>
        </Container>
    );

    return (
        <AdminDashboardLayout>
            {pageContent}
        </AdminDashboardLayout>
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
