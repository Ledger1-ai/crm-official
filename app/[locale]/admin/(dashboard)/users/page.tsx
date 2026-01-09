import { getUsers } from "@/actions/get-users";
import React from "react";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { InviteForm } from "@/app/[locale]/cms/(dashboard)/users/components/IviteForm";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminUserDataTable } from "@/app/[locale]/cms/(dashboard)/users/table-components/data-table";
import { columns } from "@/app/[locale]/cms/(dashboard)/users/table-components/columns";
import { Users } from "@prisma/client";
import SendMailToAll from "@/app/[locale]/cms/(dashboard)/users/components/send-mail-to-all";

import { getCurrentUserTeamId } from "@/lib/team-utils";

const AdminUsersPage = async () => {
    const users: Users[] = await getUsers();
    const session = await getServerSession(authOptions);
    const teamInfo = await getCurrentUserTeamId();

    // Allow access if Global Admin OR Team Admin
    const isGlobalAdmin = session?.user?.isAdmin;
    const isTeamAdmin = teamInfo?.teamRole === "ADMIN" || teamInfo?.teamRole === "OWNER";

    if (!isGlobalAdmin && !isTeamAdmin) {
        return (
            <Container
                title="Administration"
                description="You are not authorized to view this page."
            >
                <div className="flex w-full h-full items-center justify-center">
                    Access not allowed. You must be a Team Admin or Global Admin.
                </div>
            </Container>
        );
    }

    return (
        <Container
            title="Users Administration"
            description="Manage users, invite new members, and configure user-specific module access."
            action={<SendMailToAll />}
        >
            <div className="space-y-6">
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
                        <AdminUserDataTable columns={columns} data={users} />
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default AdminUsersPage;
