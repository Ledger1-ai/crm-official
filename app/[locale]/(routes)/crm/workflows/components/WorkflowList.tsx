"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    MoreHorizontal,
    Play,
    Pause,
    Trash2,
    Edit,
    Clock,
    CheckCircle2,
    AlertCircle,
    Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { activateWorkflow, pauseWorkflow, deleteWorkflow } from "@/actions/crm/workflows";
import { toast } from "sonner";

interface Workflow {
    id: string;
    name: string;
    description: string | null;
    status: "DRAFT" | "ACTIVE" | "PAUSED" | "ARCHIVED";
    trigger_type: string;
    createdAt: Date;
    updatedAt: Date;
    creator: {
        id: string;
        name: string | null;
        avatar: string | null;
    } | null;
    _count: {
        executions: number;
    };
}

interface WorkflowListProps {
    workflows: Workflow[];
}

const statusConfig = {
    DRAFT: { label: "Draft", variant: "secondary" as const, icon: Edit },
    ACTIVE: { label: "Active", variant: "default" as const, icon: CheckCircle2 },
    PAUSED: { label: "Paused", variant: "outline" as const, icon: Pause },
    ARCHIVED: { label: "Archived", variant: "destructive" as const, icon: AlertCircle },
};

const triggerLabels: Record<string, string> = {
    DEAL_ROOM_OPENED: "DealRoom Opened",
    SENTIMENT_NEGATIVE: "Negative Sentiment",
    LEAD_CREATED: "Lead Created",
    FORM_SUBMITTED: "Form Submitted",
    MANUAL: "Manual Trigger",
    RECORD_CREATED: "Record Created",
    RECORD_UPDATED: "Record Updated",
    RECORD_DELETED: "Record Deleted",
    SCHEDULED: "Scheduled",
    APPROVAL_RESPONSE: "Approval Response",
};

export function WorkflowList({ workflows }: WorkflowListProps) {
    const router = useRouter();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);
    const [loading, setLoading] = useState<string | null>(null);

    const handleActivate = async (id: string) => {
        setLoading(id);
        const result = await activateWorkflow(id);
        if (result.success) {
            toast.success("FlowState activated");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to activate");
        }
        setLoading(null);
    };

    const handlePause = async (id: string) => {
        setLoading(id);
        const result = await pauseWorkflow(id);
        if (result.success) {
            toast.success("FlowState paused");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to pause");
        }
        setLoading(null);
    };

    const handleDelete = async () => {
        if (!workflowToDelete) return;

        setLoading(workflowToDelete);
        const result = await deleteWorkflow(workflowToDelete);
        if (result.success) {
            toast.success("FlowState deleted");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to delete");
        }
        setLoading(null);
        setDeleteDialogOpen(false);
        setWorkflowToDelete(null);
    };

    return (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workflows.map((workflow) => {
                    const StatusIcon = statusConfig[workflow.status].icon;

                    return (
                        <Card
                            key={workflow.id}
                            className="cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => router.push(`/crm/workflows/${workflow.id}`)}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded">
                                            <Zap className="h-4 w-4 text-orange-600" />
                                        </div>
                                        <CardTitle className="text-lg">{workflow.name}</CardTitle>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/crm/workflows/${workflow.id}`);
                                                }}
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit
                                            </DropdownMenuItem>
                                            {workflow.status === "ACTIVE" ? (
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handlePause(workflow.id);
                                                    }}
                                                >
                                                    <Pause className="mr-2 h-4 w-4" />
                                                    Pause
                                                </DropdownMenuItem>
                                            ) : (
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleActivate(workflow.id);
                                                    }}
                                                >
                                                    <Play className="mr-2 h-4 w-4" />
                                                    Activate
                                                </DropdownMenuItem>
                                            )}
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setWorkflowToDelete(workflow.id);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardDescription className="line-clamp-2">
                                    {workflow.description || "No description"}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between text-sm">
                                    <Badge variant={statusConfig[workflow.status].variant}>
                                        <StatusIcon className="mr-1 h-3 w-3" />
                                        {statusConfig[workflow.status].label}
                                    </Badge>
                                    <span className="text-muted-foreground">
                                        {triggerLabels[workflow.trigger_type] || workflow.trigger_type}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {formatDistanceToNow(new Date(workflow.updatedAt), { addSuffix: true })}
                                    </div>
                                    <span>{workflow._count.executions} runs</span>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete FlowState?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. All execution history will also be deleted.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
