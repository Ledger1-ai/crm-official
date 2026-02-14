"use client";

import { useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, LayoutGrid, Database, Clock, CheckCircle2 } from "lucide-react";
import { createWorkflow } from "@/actions/crm/workflows";
import { toast } from "sonner";

const formSchema = z.object({
    name: z.string().min(1, "Name is required").max(100),
    description: z.string().max(500).optional(),
    flow_type: z.string().min(1, "Select a FlowState type"),
    trigger_type: z.string().min(1, "Select a trigger"),
    object_type: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateWorkflowDialogProps {
    teamId: string;
    children: ReactNode;
}

const flowTypes = [
    { value: "AUTO_FLOW", label: "Auto Flow", description: "Runs in the background when triggered", icon: Zap, color: "bg-orange-500" },
    { value: "INTERACTIVE", label: "Interactive Flow", description: "Guided wizard for users to fill in data", icon: LayoutGrid, color: "bg-purple-500" },
    { value: "EVENT_DRIVEN", label: "Event-Driven Flow", description: "Runs automatically when a record changes", icon: Database, color: "bg-cyan-500" },
    { value: "SCHEDULED", label: "Scheduled Automation", description: "Runs on a set schedule", icon: Clock, color: "bg-blue-500" },
    { value: "APPROVAL_CHAIN", label: "Approval Chain", description: "Routes records through approval steps", icon: CheckCircle2, color: "bg-rose-500" },
];

const triggerOptions: Record<string, { value: string; label: string; description: string }[]> = {
    AUTO_FLOW: [
        { value: "DEAL_ROOM_OPENED", label: "DealRoom Opened", description: "When a client opens a DealRoom link" },
        { value: "SENTIMENT_NEGATIVE", label: "Negative Sentiment", description: "When call sentiment is detected as negative" },
        { value: "LEAD_CREATED", label: "Lead Created", description: "When a new lead is added" },
        { value: "FORM_SUBMITTED", label: "Form Submitted", description: "When a form submission is received" },
        { value: "MANUAL", label: "Manual Trigger", description: "Triggered manually via API or button" },
    ],
    INTERACTIVE: [
        { value: "MANUAL", label: "User Launch", description: "User opens this flow from a button or link" },
    ],
    EVENT_DRIVEN: [
        { value: "RECORD_CREATED", label: "Record Created", description: "When a new record is created" },
        { value: "RECORD_UPDATED", label: "Record Updated", description: "When a record is updated" },
        { value: "RECORD_DELETED", label: "Record Deleted", description: "When a record is deleted" },
    ],
    SCHEDULED: [
        { value: "SCHEDULED", label: "Scheduled Run", description: "Runs on a configurable schedule" },
    ],
    APPROVAL_CHAIN: [
        { value: "APPROVAL_RESPONSE", label: "Approval Response", description: "When an approval action is taken" },
        { value: "MANUAL", label: "Submit for Approval", description: "Manually submit a record for approval" },
    ],
};

const objectTypes = [
    { value: "crm_Leads", label: "Leads" },
    { value: "crm_Opportunities", label: "Opportunities" },
    { value: "crm_Accounts", label: "Accounts" },
    { value: "crm_Contacts", label: "Contacts" },
    { value: "crm_Cases", label: "Cases" },
    { value: "crm_Contracts", label: "Contracts" },
    { value: "Invoices", label: "Invoices" },
];

export function CreateWorkflowDialog({ teamId, children }: CreateWorkflowDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            description: "",
            flow_type: "",
            trigger_type: "",
            object_type: "",
        },
    });

    const selectedFlowType = form.watch("flow_type");
    const availableTriggers = triggerOptions[selectedFlowType] || [];
    const showObjectType = ["EVENT_DRIVEN", "INTERACTIVE", "APPROVAL_CHAIN"].includes(selectedFlowType);

    const onSubmit = async (values: FormValues) => {
        setLoading(true);

        const triggerLabel = availableTriggers.find(t => t.value === values.trigger_type)?.label || "Trigger";

        const result = await createWorkflow({
            name: values.name,
            description: values.description,
            trigger_type: values.trigger_type,
            team_id: teamId,
            nodes: [
                {
                    id: "trigger-1",
                    type: "trigger",
                    position: { x: 250, y: 50 },
                    data: {
                        label: triggerLabel,
                        triggerType: values.trigger_type,
                    },
                },
            ],
            edges: [],
        });

        if (result.success && result.workflow) {
            toast.success("FlowState created! Opening editor...");
            setOpen(false);
            form.reset();
            router.push(`/crm/workflows/${result.workflow.id}`);
        } else {
            toast.error(result.error || "Failed to create FlowState");
        }

        setLoading(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[560px]">
                <DialogHeader>
                    <DialogTitle>Create New FlowState</DialogTitle>
                    <DialogDescription>
                        Choose your flow type, set up the basics, then design in the visual editor.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        {/* Flow Type Selection */}
                        <FormField
                            control={form.control}
                            name="flow_type"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>FlowState Type</FormLabel>
                                    <div className="grid grid-cols-2 gap-2">
                                        {flowTypes.map((ft) => {
                                            const Icon = ft.icon;
                                            const isSelected = field.value === ft.value;
                                            return (
                                                <button
                                                    key={ft.value}
                                                    type="button"
                                                    onClick={() => {
                                                        field.onChange(ft.value);
                                                        form.setValue("trigger_type", "");
                                                    }}
                                                    className={`flex items-start gap-2.5 p-3 rounded-lg border-2 text-left transition-all ${isSelected
                                                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                                                            : "border-border hover:border-primary/40 hover:bg-muted/30"
                                                        }`}
                                                >
                                                    <div className={`p-1.5 rounded ${ft.color}`}>
                                                        <Icon className="h-3.5 w-3.5 text-white" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">{ft.label}</div>
                                                        <div className="text-[11px] text-muted-foreground leading-tight">
                                                            {ft.description}
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>FlowState Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g., Follow-up on DealRoom View"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (Optional)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="What does this flow do?"
                                            className="resize-none"
                                            rows={2}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Object Type (for Event-Driven & Interactive Flows) */}
                        {showObjectType && (
                            <FormField
                                control={form.control}
                                name="object_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Object</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Which object does this apply to?" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {objectTypes.map((obj) => (
                                                    <SelectItem key={obj.value} value={obj.value}>
                                                        {obj.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Select the CRM object this FlowState operates on
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        {/* Trigger */}
                        {selectedFlowType && (
                            <FormField
                                control={form.control}
                                name="trigger_type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Trigger</FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="What starts this FlowState?" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {availableTriggers.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        <div className="flex flex-col">
                                                            <span>{option.label}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {option.description}
                                                            </span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            Choose what event will start this FlowState
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Create & Edit
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
