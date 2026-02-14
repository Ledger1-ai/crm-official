import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Container from "@/app/(routes)/components/ui/Container";
import { getCurrentUserTeamId } from "@/lib/team-utils";
import { getMyTeamBillingInvoices } from "@/actions/billing/get-team-billing-invoices";
import { getMyTeamAiUsage } from "@/actions/billing/get-ai-usage";
import { getMyTeamSubscription } from "@/actions/billing/get-my-subscription";
import { AdminBillingDashboard } from "./_components/AdminBillingDashboard";

export default async function AdminBillingPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return redirect("/admin/login");

    const teamInfo = await getCurrentUserTeamId();
    if (!teamInfo?.teamId) {
        return (
            <Container title="Billing" description="No organization found.">
                <div className="p-4">You are not assigned to a team.</div>
            </Container>
        );
    }

    const [invoices, aiUsageData, subscription] = await Promise.all([
        getMyTeamBillingInvoices(),
        getMyTeamAiUsage({ limit: 100 }),
        getMyTeamSubscription()
    ]);

    return (
        <Container
            title="Billing & Transactions"
            description="View your subscription, AI usage, and BasaltECHO credits."
            fluid
        >
            <AdminBillingDashboard
                invoices={invoices}
                aiUsageLogs={aiUsageData.logs}
                aiUsageSummary={aiUsageData.summary}
                subscription={subscription}
                teamId={teamInfo.teamId}
            />
        </Container>
    );
}
