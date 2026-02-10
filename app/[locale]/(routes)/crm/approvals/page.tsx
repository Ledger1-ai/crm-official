import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getApprovalProcesses, getMyPendingApprovals } from "@/actions/crm/approvals";
import { ApprovalsClient } from "./components/ApprovalsClient";
import { CheckCircle2 } from "lucide-react";
import { Suspense } from "react";

export const metadata = {
    title: "Approval Chains | CRM",
    description: "Create approval chains and manage pending approvals"
};

export default async function ApprovalsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    const teamId = (session.user as { team_id?: string }).team_id || "";
    const [processes, pendingApprovals] = await Promise.all([
        getApprovalProcesses(teamId),
        getMyPendingApprovals(teamId),
    ]);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-rose-500 to-pink-600 rounded-lg">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">Approval Chains</h1>
                        <p className="text-sm text-muted-foreground">
                            Define approval chains and manage pending requests
                        </p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                <Suspense fallback={<div>Loading approvals...</div>}>
                    <ApprovalsClient
                        processes={JSON.parse(JSON.stringify(processes))}
                        pendingApprovals={JSON.parse(JSON.stringify(pendingApprovals))}
                        teamId={teamId}
                        currentUserId={session.user.id}
                    />
                </Suspense>
            </div>
        </div>
    );
}
