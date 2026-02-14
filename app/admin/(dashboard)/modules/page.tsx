// ... (Top of file usually has imports, I will replace fully or carefully)
import React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/(routes)/components/ui/Container";
import { prismadb } from "@/lib/prisma";
import { ROLE_CONFIGS } from "@/lib/role-permissions";
import RoleModuleCard from "./components/RoleModuleCard";
import { AddRoleButton } from "./components/AddRoleButton";
import DepartmentRoleManager from "./components/DepartmentRoleManager";
import { getEffectiveRoleModules } from "@/actions/permissions/get-effective-permissions";
import { updateRoleModules } from "@/actions/permissions/update-role-modules";
import { ChevronRight, Home } from "lucide-react";

export default async function AdminModulesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
        return (
            <Container title="Access Denied" description="Please sign in.">
                <div>Access Denied</div>
            </Container>
        );
    }

    // Get user and team info
    const user = await prismadb.users.findUnique({
        where: { email: session.user.email || "" },
        include: { assigned_team: true },
    });

    const isGlobalAdmin = session?.user?.isAdmin;
    const isTeamSuperAdmin = user?.team_role === 'SUPER_ADMIN' || user?.team_role === 'OWNER' || user?.team_role === 'PLATFORM_ADMIN';

    if (!isGlobalAdmin && !isTeamSuperAdmin) {
        return (
            <Container
                title="Role & Access Control"
                description="You are not authorized to view this page"
            >
                <div className="flex w-full h-full items-center justify-center">
                    Access not allowed
                </div>
            </Container>
        );
    }

    const teamId = user?.assigned_team?.id;
    const teamScope = teamId ? { team_id: teamId } : {};

    if (!teamId) return <div>No Organization Found</div>;

    // Fetch Organization-level stats
    const [adminCount, memberCount, viewerCount, customRoles, departments] = await Promise.all([
        prismadb.users.count({ where: { ...teamScope, team_role: "ADMIN" } }),
        prismadb.users.count({ where: { ...teamScope, OR: [{ team_role: "MEMBER" }, { team_role: null }] } }),
        prismadb.users.count({ where: { ...teamScope, team_role: "VIEWER" } }),
        prismadb.customRole.findMany({
            where: { team_id: teamId },
            include: { _count: { select: { users: true } } },
            orderBy: { created_at: "asc" },
        }),
        // Fetch sub-departments
        prismadb.team.findMany({
            where: { parent_id: teamId, team_type: 'DEPARTMENT' },
            orderBy: { name: 'asc' }
        })
    ]);

    // Fetch Organization Permissions
    const [orgAdminModules, orgMemberModules, orgViewerModules] = await Promise.all([
        getEffectiveRoleModules(teamId, 'ADMIN', 'ORGANIZATION'),
        getEffectiveRoleModules(teamId, 'MEMBER', 'ORGANIZATION'),
        getEffectiveRoleModules(teamId, 'VIEWER', 'ORGANIZATION'),
    ]);

    // Fetch Department Permissions (for each department found)
    // We Map departments to a promise that returns their modules & counts
    const departmentsData = await Promise.all(departments.map(async (dept) => {
        const [adminModules, memberModules, viewerModules, adminCount, memberCount, viewerCount] = await Promise.all([
            getEffectiveRoleModules(dept.id, 'ADMIN', 'DEPARTMENT'),
            getEffectiveRoleModules(dept.id, 'MEMBER', 'DEPARTMENT'),
            getEffectiveRoleModules(dept.id, 'VIEWER', 'DEPARTMENT'),
            prismadb.users.count({
                where: {
                    OR: [
                        { department_id: dept.id, team_role: 'ADMIN' },
                        { team_id: dept.id, team_role: 'ADMIN' }
                    ]
                } as any
            }),
            prismadb.users.count({
                where: {
                    OR: [
                        { department_id: dept.id, OR: [{ team_role: 'MEMBER' }, { team_role: null }] },
                        { team_id: dept.id, OR: [{ team_role: 'MEMBER' }, { team_role: null }] }
                    ]
                } as any
            }),
            prismadb.users.count({
                where: {
                    OR: [
                        { department_id: dept.id, team_role: 'VIEWER' },
                        { team_id: dept.id, team_role: 'VIEWER' }
                    ]
                } as any
            }),
        ]);

        return {
            ...dept,
            adminModules,
            memberModules,
            viewerModules,
            adminCount,
            memberCount,
            viewerCount
        };
    }));

    return (
        <Container
            title="Role & Access Control"
            description="Define roles and restrict which CRM modules specific user groups can access."
            action={teamId ? <AddRoleButton teamId={teamId} departments={departments} /> : undefined}
        >
            <div className="space-y-10">

                {/* Breadcrumbs */}
                <nav className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Link href="/admin" className="flex items-center gap-1 hover:text-foreground transition-colors">
                        <Home className="w-4 h-4" />
                        Admin
                    </Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-foreground font-medium">Roles & Modules</span>
                </nav>

                {/* Departments & Organization Roles Manager */}
                <DepartmentRoleManager
                    teamId={teamId}
                    departments={departmentsData}
                    orgData={{
                        adminModules: orgAdminModules,
                        memberModules: orgMemberModules,
                        viewerModules: orgViewerModules,
                        adminCount: adminCount,
                        memberCount: memberCount,
                        viewerCount: viewerCount
                    }}
                />

                {/* Custom Roles Section */}
                {customRoles.length > 0 && (
                    <div>
                        <h3 className="text-lg font-semibold mb-1">Custom Roles</h3>
                        <p className="text-sm text-muted-foreground mb-4">Specialized roles created for this organization.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {customRoles.map((role: any) => (
                                <RoleModuleCard
                                    key={role.id}
                                    roleName={role.name}
                                    roleKey={role.id}
                                    description={role.description || "Custom team role"}
                                    userCount={role._count.users}
                                    enabledModules={role.modules}
                                    isCustom
                                    onModulesChange={async (key, mods) => {
                                        // Placeholder for custom role updates
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Super Admins / Owners have full access to all modules and don't require configuration.
                        Module access settings affect all users with the corresponding role in the specified context.
                    </p>
                </div>
            </div>
        </Container>
    );
}
