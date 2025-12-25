import { getUsers } from "@/actions/get-users";
import React from "react";
import Container from "@/app/[locale]/(routes)/components/ui/Container";
import { InviteForm } from "@/app/[locale]/cms/(dashboard)/users/components/IviteForm";
import { Separator } from "@/components/ui/separator";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminUserDataTable } from "@/app/[locale]/cms/(dashboard)/users/table-components/data-table";
import { columns } from "@/app/[locale]/cms/(dashboard)/users/table-components/columns";
import { Users } from "@prisma/client";
import SendMailToAll from "@/app/[locale]/cms/(dashboard)/users/components/send-mail-to-all";

import { getCurrentUserTeamId } from "@/lib/team-utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const AnyLink = Link as any;
const AnyButton = Button as any;

const AdminUsersPage = async () => {
    const users: Users[] = await getUsers();
    const session = await getServerSession(authOptions);
    const teamInfo = await getCurrentUserTeamId();

    // Allow access if Global Admin OR Team Admin-
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
            title="Users administration"
            description={"Here you can manage your Ledger1CRM users"}
        >
            <div className="mb-4">
                <AnyLink href="/admin">
                    <AnyButton variant="ghost" className="pl-0 hover:pl-2 transition-all">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Administration
                    </AnyButton>
                </AnyLink>
            </div>
            <div className="flex-col1">
                <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                    Invite new user to Ledger1CRM
                </h4>
                <InviteForm />
            </div>
            <Separator />
            <div>
                <SendMailToAll />
            </div>
            <Separator />

            <AdminUserDataTable columns={columns} data={users} />
        </Container>
    );
};

export default AdminUsersPage;
