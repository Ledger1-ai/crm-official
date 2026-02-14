import CrmSidebar from "./components/CrmSidebar";
import UtilityBar from "@/components/UtilityBar";
import { prismadb } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getEffectiveRoleModules } from "@/actions/permissions/get-effective-permissions";
import { PermissionsProvider } from "@/components/providers/permissions-provider";

export default async function CrmLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getServerSession(authOptions);
    let allowedModules: string[] = [];
    let isMember = false;
    let isSuperAdmin = false;
    let user = null;

    if (session?.user?.id) {
        user = await prismadb.users.findUnique({
            where: { id: session.user.id },
            select: {
                team_role: true,
                team_id: true,
                department_id: true,
                assigned_modules: true, // Capture override if exists
                is_admin: true,
                email: true
            }
        });

        isMember = user?.team_role === "MEMBER";

        const role = (user?.team_role || '').trim().toUpperCase();
        // Check DB is_admin flag OR role-based access
        isSuperAdmin = (user as any)?.is_admin === true || ['SUPER_ADMIN', 'OWNER', 'PLATFORM_ADMIN', 'SYSADM', 'PLATFORM ADMIN', 'ADMIN'].includes(role);

        if (isSuperAdmin) {
            allowedModules = ['*'];
        } else if (user) {
            // Check specific assignments first
            if (user.assigned_modules && user.assigned_modules.length > 0) {
                allowedModules = user.assigned_modules;
            } else {
                // Fetch Role Permissions
                const contextId = user.department_id || user.team_id;
                const scope = user.department_id ? 'DEPARTMENT' : 'ORGANIZATION';

                if (contextId && user.team_role) {
                    allowedModules = await getEffectiveRoleModules(contextId, user.team_role, scope);
                }
            }
        }

        console.log('[DEBUG CRM LAYOUT]', {
            userId: session.user.id,
            teamRole: user?.team_role,
            isSuperAdmin: isSuperAdmin,
            allowedModulesLength: allowedModules.length,
            modules: allowedModules // Inspect the actual list
        });
    }

    return (
        <div className="flex h-full w-full overflow-hidden relative">
            {/* CrmSidebar removed - unified into Main Sidebar */}
            <div className="flex-1 min-h-0 flex flex-col relative transition-all duration-300">
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                    <PermissionsProvider permissions={allowedModules} isSuperAdmin={isSuperAdmin}>
                        {children}
                    </PermissionsProvider>
                </div>
            </div>
        </div>
    );
}
