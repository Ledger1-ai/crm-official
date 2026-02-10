"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus, Trash2, Play, Pause, Loader2, CheckCircle2, XCircle, Clock,
    ChevronRight, UserCheck, Users2, Shield, RotateCcw, ArrowRight,
    Circle, CheckCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import {
    createApprovalProcess, updateApprovalProcessStatus,
    deleteApprovalProcess, processApprovalAction
} from "@/actions/crm/approvals";

type AnyProcess = any;
type AnyRequest = any;

interface Props {
    processes: AnyProcess[];
    pendingApprovals: AnyRequest[];
    teamId: string;
    currentUserId: string;
}

const objectTypeLabels: Record<string, string> = {
    crm_Leads: "Leads",
    crm_Opportunities: "Opportunities",
    crm_Accounts: "Accounts",
    crm_Contacts: "Contacts",
    crm_Cases: "Cases",
    crm_Contracts: "Contracts",
    Invoices: "Invoices",
};

const objectTypes = Object.entries(objectTypeLabels).map(([value, label]) => ({ value, label }));

const statusBadgeMap: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; icon: React.ReactNode }> = {
    PENDING: { variant: "outline", icon: <Clock className="h-3 w-3" /> },
    APPROVED: { variant: "default", icon: <CheckCircle2 className="h-3 w-3" /> },
    REJECTED: { variant: "destructive", icon: <XCircle className="h-3 w-3" /> },
    RECALLED: { variant: "secondary", icon: <RotateCcw className="h-3 w-3" /> },
};

export function ApprovalsClient({ processes, pendingApprovals, teamId, currentUserId }: Props) {
    const router = useRouter();
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [loading, setLoading] = useState<string | null>(null);
    const [actionComment, setActionComment] = useState("");

    // Create form state
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formObject, setFormObject] = useState("");
    const [formCriteria, setFormCriteria] = useState("");
    const [formSteps, setFormSteps] = useState<{ name: string; approver_type: string; approver_role?: string }[]>([
        { name: "Manager Approval", approver_type: "ROLE", approver_role: "ADMIN" },
    ]);

    const resetForm = () => {
        setFormName(""); setFormDesc(""); setFormObject("");
        setFormCriteria("");
        setFormSteps([{ name: "Manager Approval", approver_type: "ROLE", approver_role: "ADMIN" }]);
    };

    const addStep = () => {
        setFormSteps([...formSteps, {
            name: `Step ${formSteps.length + 1}`,
            approver_type: "ROLE",
            approver_role: "SUPER_ADMIN",
        }]);
    };

    const removeStep = (idx: number) => {
        setFormSteps(formSteps.filter((_, i) => i !== idx));
    };

    const handleCreate = async () => {
        if (!formName || !formObject || formSteps.length === 0) {
            toast.error("Please fill in required fields and add at least one step");
            return;
        }
        setLoading("create");
        const result = await createApprovalProcess({
            name: formName,
            description: formDesc || undefined,
            object_type: formObject,
            entry_criteria: formCriteria || undefined,
            team_id: teamId,
            steps: formSteps.map((s, i) => ({
                step_number: i + 1,
                name: s.name,
                approver_type: s.approver_type,
                approver_role: s.approver_role,
            })),
        });
        if (result.success) {
            toast.success("Approval chain created");
            setCreateOpen(false);
            resetForm();
            router.refresh();
        } else {
            toast.error(result.error || "Failed to create");
        }
        setLoading(null);
    };

    const handleStatusChange = async (id: string, status: "ACTIVE" | "INACTIVE" | "DRAFT") => {
        setLoading(id);
        const result = await updateApprovalProcessStatus(id, status as never);
        if (result.success) {
            toast.success(`Process ${status.toLowerCase()}`);
            router.refresh();
        } else {
            toast.error(result.error || "Failed to update");
        }
        setLoading(null);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(deleteId);
        const result = await deleteApprovalProcess(deleteId);
        if (result.success) {
            toast.success("Process deleted");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to delete");
        }
        setDeleteId(null);
        setLoading(null);
    };

    const handleApprovalAction = async (requestId: string, action: "APPROVE" | "REJECT" | "RECALL") => {
        setLoading(requestId);
        const result = await processApprovalAction({
            request_id: requestId,
            action: action as never,
            comment: actionComment || undefined,
        });
        if (result.success) {
            toast.success(`Request ${action.toLowerCase()}d`);
            setActionComment("");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to process");
        }
        setLoading(null);
    };

    return (
        <>
            <Tabs defaultValue="pending" className="space-y-6">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger value="pending" className="gap-2">
                            <Clock className="h-4 w-4" />
                            My Approvals
                            {pendingApprovals.length > 0 && (
                                <Badge variant="destructive" className="ml-1 h-5 min-w-5 text-xs">
                                    {pendingApprovals.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="processes" className="gap-2">
                            <Shield className="h-4 w-4" />
                            Processes
                        </TabsTrigger>
                    </TabsList>

                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Process
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[600px] max-h-[85vh]">
                            <DialogHeader>
                                <DialogTitle>Create Approval Chain</DialogTitle>
                                <DialogDescription>
                                    Define the steps that records must go through for approval.
                                </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[60vh] pr-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Process Name *</Label>
                                        <Input
                                            placeholder="e.g., Large Deal Approval"
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Description</Label>
                                        <Textarea
                                            placeholder="What does this process do?"
                                            value={formDesc}
                                            onChange={(e) => setFormDesc(e.target.value)}
                                            rows={2}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Object *</Label>
                                        <Select value={formObject} onValueChange={setFormObject}>
                                            <SelectTrigger><SelectValue placeholder="Select object..." /></SelectTrigger>
                                            <SelectContent>
                                                {objectTypes.map(o => (
                                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Entry Criteria (Optional Formula)</Label>
                                        <Input
                                            placeholder='e.g., amount > 100000 OR discount > 20'
                                            value={formCriteria}
                                            onChange={(e) => setFormCriteria(e.target.value)}
                                            className="font-mono text-sm"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave empty to require approval for all records of this type
                                        </p>
                                    </div>

                                    <Separator />

                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <Label className="text-sm font-semibold">Approval Steps</Label>
                                            <Button type="button" variant="outline" size="sm" onClick={addStep} className="gap-1">
                                                <Plus className="h-3 w-3" />
                                                Add Step
                                            </Button>
                                        </div>
                                        <div className="space-y-3">
                                            {formSteps.map((step, idx) => (
                                                <Card key={idx} className="p-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold mt-0.5">
                                                            {idx + 1}
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <Input
                                                                placeholder="Step name"
                                                                value={step.name}
                                                                onChange={(e) => {
                                                                    const updated = [...formSteps];
                                                                    updated[idx].name = e.target.value;
                                                                    setFormSteps(updated);
                                                                }}
                                                            />
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <Select
                                                                    value={step.approver_type}
                                                                    onValueChange={(v) => {
                                                                        const updated = [...formSteps];
                                                                        updated[idx].approver_type = v;
                                                                        setFormSteps(updated);
                                                                    }}
                                                                >
                                                                    <SelectTrigger className="text-xs">
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="ROLE">By Role</SelectItem>
                                                                        <SelectItem value="MANAGER">Manager</SelectItem>
                                                                        <SelectItem value="SPECIFIC_USER">Specific User</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                {step.approver_type === "ROLE" && (
                                                                    <Select
                                                                        value={step.approver_role || ""}
                                                                        onValueChange={(v) => {
                                                                            const updated = [...formSteps];
                                                                            updated[idx].approver_role = v;
                                                                            setFormSteps(updated);
                                                                        }}
                                                                    >
                                                                        <SelectTrigger className="text-xs">
                                                                            <SelectValue placeholder="Select role..." />
                                                                        </SelectTrigger>
                                                                        <SelectContent>
                                                                            <SelectItem value="ADMIN">Admin</SelectItem>
                                                                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                                                                            <SelectItem value="MANAGER">Manager</SelectItem>
                                                                        </SelectContent>
                                                                    </Select>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {formSteps.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-7 w-7 text-destructive"
                                                                onClick={() => removeStep(idx)}
                                                            >
                                                                <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                    {idx < formSteps.length - 1 && (
                                                        <div className="flex justify-center my-1">
                                                            <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
                                                        </div>
                                                    )}
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={loading === "create"}>
                                    {loading === "create" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Process
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* My Pending Approvals Tab */}
                <TabsContent value="pending" className="space-y-4">
                    {pendingApprovals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                            <div className="p-4 bg-muted rounded-full mb-4">
                                <CheckCheck className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">You&#39;re all caught up!</h2>
                            <p className="text-muted-foreground max-w-md">
                                No pending approval requests require your attention.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {pendingApprovals.map((req: AnyRequest) => (
                                <Card key={req.id} className="overflow-hidden">
                                    <CardContent className="p-0">
                                        <div className="flex items-stretch">
                                            {/* Left accent bar */}
                                            <div className="w-1 bg-amber-400" />
                                            <div className="flex-1 p-4">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold">{req.process?.name}</span>
                                                            <Badge variant="outline" className="text-xs gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                Step {req.current_step}
                                                            </Badge>
                                                        </div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                            <span>Submitted by</span>
                                                            <Avatar className="h-5 w-5">
                                                                <AvatarImage src={req.submitter?.avatar || ""} />
                                                                <AvatarFallback className="text-[10px]">
                                                                    {req.submitter?.name?.charAt(0) || "?"}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <span className="font-medium">{req.submitter?.name || "Unknown"}</span>
                                                            <span>·</span>
                                                            <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                        {req.submit_comment && (
                                                            <p className="text-sm text-muted-foreground mt-2 italic">
                                                                &quot;{req.submit_comment}&quot;
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2 ml-4">
                                                        <Input
                                                            placeholder="Comment (optional)"
                                                            className="w-40 text-xs"
                                                            value={actionComment}
                                                            onChange={(e) => setActionComment(e.target.value)}
                                                        />
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                                                            onClick={() => handleApprovalAction(req.id, "REJECT")}
                                                            disabled={loading === req.id}
                                                        >
                                                            <XCircle className="h-3.5 w-3.5" />
                                                            Reject
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            className="gap-1 bg-emerald-600 hover:bg-emerald-700"
                                                            onClick={() => handleApprovalAction(req.id, "APPROVE")}
                                                            disabled={loading === req.id}
                                                        >
                                                            {loading === req.id
                                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                : <CheckCircle2 className="h-3.5 w-3.5" />
                                                            }
                                                            Approve
                                                        </Button>
                                                    </div>
                                                </div>

                                                {/* Timeline of actions */}
                                                {req.actions && req.actions.length > 0 && (
                                                    <div className="mt-3 pt-3 border-t space-y-1.5">
                                                        {req.actions.map((action: AnyRequest) => (
                                                            <div key={action.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                                                                {action.action === "APPROVE"
                                                                    ? <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                                    : action.action === "REJECT"
                                                                        ? <XCircle className="h-3 w-3 text-red-500" />
                                                                        : <Circle className="h-3 w-3" />
                                                                }
                                                                <span className="font-medium">{action.actor?.name}</span>
                                                                <span>{action.action.toLowerCase()}</span>
                                                                {action.comment && <span>— &quot;{action.comment}&quot;</span>}
                                                                <span>{new Date(action.createdAt).toLocaleString()}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Processes Tab */}
                <TabsContent value="processes" className="space-y-4">
                    {processes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[40vh] text-center">
                            <div className="p-4 bg-muted rounded-full mb-4">
                                <Shield className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <h2 className="text-xl font-semibold mb-2">No approval chains yet</h2>
                            <p className="text-muted-foreground mb-6 max-w-md">
                                Create approval chains to define who needs to approve records
                                before they can be finalized.
                            </p>
                            <Button size="lg" className="gap-2" onClick={() => setCreateOpen(true)}>
                                <Plus className="h-5 w-5" />
                                Create Your First Chain
                            </Button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {processes.map(proc => (
                                <Card key={proc.id}>
                                    <CardContent className="p-5">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="font-semibold text-lg">{proc.name}</span>
                                                    <Badge
                                                        variant={proc.status === "ACTIVE" ? "default" : proc.status === "INACTIVE" ? "secondary" : "outline"}
                                                    >
                                                        {proc.status}
                                                    </Badge>
                                                    <Badge variant="outline">
                                                        {objectTypeLabels[proc.object_type] || proc.object_type}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs">
                                                        {proc._count?.requests || 0} requests
                                                    </Badge>
                                                </div>
                                                {proc.description && (
                                                    <p className="text-sm text-muted-foreground mb-3">{proc.description}</p>
                                                )}

                                                {/* Steps visualization */}
                                                <div className="flex items-center gap-1 flex-wrap">
                                                    {proc.steps?.map((step: AnyProcess, idx: number) => (
                                                        <div key={step.id} className="flex items-center gap-1">
                                                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-muted rounded-full text-xs">
                                                                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
                                                                    {idx + 1}
                                                                </div>
                                                                <span className="font-medium">{step.name}</span>
                                                                <span className="text-muted-foreground">
                                                                    ({step.approver_type === "ROLE" ? step.approver_role : step.approver_type})
                                                                </span>
                                                            </div>
                                                            {idx < proc.steps.length - 1 && (
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>

                                                {proc.entry_criteria && (
                                                    <div className="mt-2 text-xs text-muted-foreground">
                                                        <span className="font-medium">Entry criteria:</span>{" "}
                                                        <code className="bg-muted px-1.5 py-0.5 rounded font-mono">
                                                            {proc.entry_criteria}
                                                        </code>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 ml-4">
                                                {proc.status === "DRAFT" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => handleStatusChange(proc.id, "ACTIVE")}
                                                        disabled={loading === proc.id}
                                                    >
                                                        <Play className="h-3 w-3" />
                                                        Activate
                                                    </Button>
                                                )}
                                                {proc.status === "ACTIVE" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => handleStatusChange(proc.id, "INACTIVE")}
                                                        disabled={loading === proc.id}
                                                    >
                                                        <Pause className="h-3 w-3" />
                                                        Deactivate
                                                    </Button>
                                                )}
                                                {proc.status === "INACTIVE" && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-1"
                                                        onClick={() => handleStatusChange(proc.id, "ACTIVE")}
                                                        disabled={loading === proc.id}
                                                    >
                                                        <Play className="h-3 w-3" />
                                                        Reactivate
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive"
                                                    onClick={() => setDeleteId(proc.id)}
                                                    disabled={loading === proc.id}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Approval Chain?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently remove this chain and all its associated requests and history.
                            This action cannot be undone.
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
