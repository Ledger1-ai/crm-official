import { Suspense } from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getWorkflows } from "@/actions/crm/workflows";
import { WorkflowList } from "./components/WorkflowList";
import { CreateWorkflowDialog } from "./components/CreateWorkflowDialog";
import { Workflow, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
    title: "FlowState | Visual Automation",
    description: "Visual builder for automating CRM processes with FlowState"
};

export default async function WorkflowsPage() {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
        redirect("/sign-in");
    }

    // Get user's team_id from session or user record
    const teamId = (session.user as { team_id?: string }).team_id;
    const workflows = await getWorkflows(teamId);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
                        <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold">FlowState</h1>
                        <p className="text-sm text-muted-foreground">
                            Visual workflow automation for your CRM
                        </p>
                    </div>
                </div>
                <CreateWorkflowDialog teamId={teamId || ""}>
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        New FlowState
                    </Button>
                </CreateWorkflowDialog>
            </div>

            {/* Content */}
            <div className="flex-1 p-6 overflow-auto">
                {workflows.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <div className="p-4 bg-muted rounded-full mb-4">
                            <Workflow className="h-12 w-12 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-semibold mb-2">No FlowStates yet</h2>
                        <p className="text-muted-foreground mb-6 max-w-md">
                            Create your first FlowState to automate repetitive tasks like
                            sending follow-up emails, creating tasks, or notifying your team.
                        </p>
                        <CreateWorkflowDialog teamId={teamId || ""}>
                            <Button size="lg" className="gap-2">
                                <Plus className="h-5 w-5" />
                                Create Your First FlowState
                            </Button>
                        </CreateWorkflowDialog>
                    </div>
                ) : (
                    <Suspense fallback={<div>Loading workflows...</div>}>
                        <WorkflowList workflows={workflows} />
                    </Suspense>
                )}
            </div>
        </div>
    );
}
