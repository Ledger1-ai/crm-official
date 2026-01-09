import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { prismadb } from "@/lib/prisma";
import { ROLE_CONFIGS, CRM_MODULES } from "@/lib/role-permissions";
import RoleModuleCard from "./components/RoleModuleCard";
import { AddRoleButton } from "./components/AddRoleButton";

export default async function AdminModulesPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
        return (
            <Container
                title="Role & Access Control"
                description="You are not admin, access not allowed"
            >
                <div className="flex w-full h-full items-center justify-center">
                    Access not allowed
                </div>
            </Container>
        );
    }

    // Get user and team info
    const user = await prismadb.users.findUnique({
        where: { email: session.user.email || "" },
        include: { assigned_team: true },
    });

    const teamId = user?.assigned_team?.id;

    // Get user counts per role
    const [adminCount, memberCount, viewerCount, customRoles] = await Promise.all([
        prismadb.users.count({ where: { team_role: "ADMIN" } }),
        prismadb.users.count({ where: { OR: [{ team_role: "MEMBER" }, { team_role: null }] } }),
        prismadb.users.count({ where: { team_role: "VIEWER" } }),
        teamId
            ? prismadb.customRole.findMany({
                where: { team_id: teamId },
                include: { _count: { select: { users: true } } },
                orderBy: { created_at: "asc" },
            })
            : [],
    ]);

    return (
        <Container
            title="Role & Access Control"
            description="Define roles and restrict which CRM modules specific user groups can access."
            action={teamId ? <AddRoleButton teamId={teamId} /> : undefined}
        >
            <div className="space-y-8">
                {/* Default Role Cards Grid */}
                <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-4">System Roles</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <RoleModuleCard
                            roleName="Admin"
                            roleKey="ADMIN"
                            description="Full access to all system features."
                            userCount={adminCount}
                            enabledModules={ROLE_CONFIGS.ADMIN.defaultModules}
                        />
                        <RoleModuleCard
                            roleName="Member"
                            roleKey="MEMBER"
                            description="Can manage content but not system settings."
                            userCount={memberCount}
                            enabledModules={ROLE_CONFIGS.MEMBER.defaultModules}
                        />
                        <RoleModuleCard
                            roleName="Viewer"
                            roleKey="VIEWER"
                            description="Read-only access."
                            userCount={viewerCount}
                            enabledModules={ROLE_CONFIGS.VIEWER.defaultModules}
                        />
                    </div>
                </div>

                {/* Custom Roles Section */}
                {customRoles.length > 0 && (
                    <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-4">Custom Roles</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {customRoles.map((role: { id: string; name: string; description: string | null; modules: string[]; _count: { users: number } }) => (
                                <RoleModuleCard
                                    key={role.id}
                                    roleName={role.name}
                                    roleKey={role.id}
                                    description={role.description || "Custom team role"}
                                    userCount={role._count.users}
                                    enabledModules={role.modules}
                                    isCustom
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* Info Section */}
                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-sm text-muted-foreground">
                        <strong>Note:</strong> Team Owners have full access to all modules and don't require configuration.
                        Module access settings affect all users with the corresponding role.
                    </p>
                </div>
            </div>
        </Container>
    );
}
