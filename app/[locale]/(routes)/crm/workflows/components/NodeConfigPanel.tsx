"use client";

import { useCallback, useMemo } from "react";
import { Node } from "@xyflow/react";
import { X, Zap, GitBranch, Clock, Repeat, Mail, MessageSquare, CheckSquare, Bell, Database, LayoutGrid, CheckCircle2, FileEdit, Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface NodeConfigPanelProps {
    node: Node | null;
    onClose: () => void;
    onUpdateNode: (nodeId: string, data: Record<string, unknown>) => void;
    allNodes: Node[];
}

// CRM Objects
const objectTypes = [
    { value: "crm_Leads", label: "Leads" },
    { value: "crm_Opportunities", label: "Opportunities" },
    { value: "crm_Accounts", label: "Accounts" },
    { value: "crm_Contacts", label: "Contacts" },
    { value: "crm_Cases", label: "Cases" },
    { value: "crm_Contracts", label: "Contracts" },
    { value: "Invoices", label: "Invoices" },
];

// Operators for conditions
const operators = [
    { value: "equals", label: "Equals" },
    { value: "not_equals", label: "Not Equals" },
    { value: "contains", label: "Contains" },
    { value: "not_contains", label: "Not Contains" },
    { value: "greater_than", label: "Greater Than" },
    { value: "less_than", label: "Less Than" },
    { value: "is_blank", label: "Is Blank" },
    { value: "is_not_blank", label: "Is Not Blank" },
    { value: "starts_with", label: "Starts With" },
    { value: "ends_with", label: "Ends With" },
];

// Screen field types
const screenFieldTypes = [
    { value: "text", label: "Text Input" },
    { value: "number", label: "Number" },
    { value: "email", label: "Email" },
    { value: "phone", label: "Phone" },
    { value: "textarea", label: "Text Area" },
    { value: "dropdown", label: "Dropdown" },
    { value: "checkbox", label: "Checkbox" },
    { value: "date", label: "Date Picker" },
    { value: "lookup", label: "Lookup (Record)" },
];

const nodeTypeInfo: Record<string, { icon: typeof Zap; label: string; color: string; bgColor: string }> = {
    trigger: { icon: Zap, label: "Trigger", color: "text-orange-500", bgColor: "bg-orange-500/10" },
    condition: { icon: GitBranch, label: "Decision", color: "text-amber-500", bgColor: "bg-amber-500/10" },
    delay: { icon: Clock, label: "Delay", color: "text-blue-500", bgColor: "bg-blue-500/10" },
    loop: { icon: Repeat, label: "Loop", color: "text-indigo-500", bgColor: "bg-indigo-500/10" },
    action: { icon: Mail, label: "Action", color: "text-green-500", bgColor: "bg-green-500/10" },
    updateRecord: { icon: Database, label: "Record Op", color: "text-cyan-500", bgColor: "bg-cyan-500/10" },
    screen: { icon: LayoutGrid, label: "Screen", color: "text-purple-500", bgColor: "bg-purple-500/10" },
    approval: { icon: CheckCircle2, label: "Approval", color: "text-rose-500", bgColor: "bg-rose-500/10" },
};

export function NodeConfigPanel({ node, onClose, onUpdateNode, allNodes }: NodeConfigPanelProps) {
    if (!node) return null;

    const data = (node.data || {}) as Record<string, unknown>;
    const nodeType = node.type || "trigger";
    const info = nodeTypeInfo[nodeType] || nodeTypeInfo.trigger;
    const Icon = info.icon;

    // Find upstream "Get Records" nodes for variable references
    const getRecordNodes = allNodes.filter(
        (n) => n.type === "updateRecord" && (n.data as Record<string, unknown>)?.operation === "GET"
    );

    const updateData = (key: string, value: unknown) => {
        onUpdateNode(node.id, { ...data, [key]: value });
    };

    const updateNestedData = (updates: Record<string, unknown>) => {
        onUpdateNode(node.id, { ...data, ...updates });
    };

    return (
        <div className="w-[380px] border-l bg-card flex flex-col h-full shadow-lg animate-in slide-in-from-right-5 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded ${info.bgColor}`}>
                        <Icon className={`h-4 w-4 ${info.color}`} />
                    </div>
                    <div>
                        <div className="text-xs text-muted-foreground font-medium uppercase">{info.label}</div>
                        <div className="text-sm font-semibold">{(data.label as string) || "Configure"}</div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Body */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-5">
                    {/* Common: Label */}
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Label</Label>
                        <Input
                            value={(data.label as string) || ""}
                            onChange={(e) => updateData("label", e.target.value)}
                            placeholder="Step name..."
                            className="text-sm"
                        />
                    </div>

                    <Separator />

                    {/* === TRIGGER CONFIG === */}
                    {nodeType === "trigger" && (
                        <TriggerConfig data={data} updateData={updateData} />
                    )}

                    {/* === CONDITION CONFIG === */}
                    {nodeType === "condition" && (
                        <ConditionConfig data={data} updateData={updateData} updateNestedData={updateNestedData} />
                    )}

                    {/* === DELAY CONFIG === */}
                    {nodeType === "delay" && (
                        <DelayConfig data={data} updateData={updateData} />
                    )}

                    {/* === LOOP CONFIG === */}
                    {nodeType === "loop" && (
                        <LoopConfig data={data} updateData={updateData} getRecordNodes={getRecordNodes} />
                    )}

                    {/* === ACTION CONFIG === */}
                    {nodeType === "action" && (
                        <ActionConfig data={data} updateData={updateData} updateNestedData={updateNestedData} />
                    )}

                    {/* === UPDATE RECORD CONFIG === */}
                    {nodeType === "updateRecord" && (
                        <UpdateRecordConfig data={data} updateData={updateData} updateNestedData={updateNestedData} />
                    )}

                    {/* === SCREEN CONFIG === */}
                    {nodeType === "screen" && (
                        <ScreenConfig data={data} updateData={updateData} updateNestedData={updateNestedData} />
                    )}

                    {/* === APPROVAL CONFIG === */}
                    {nodeType === "approval" && (
                        <ApprovalConfig data={data} updateData={updateData} />
                    )}
                </div>
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">ID: {node.id}</Badge>
                    <span className="text-[10px] text-muted-foreground">Changes auto-save to canvas</span>
                </div>
            </div>
        </div>
    );
}

// ================== SUB-CONFIGS ==================

interface ConfigProps {
    data: Record<string, unknown>;
    updateData: (key: string, value: unknown) => void;
    updateNestedData?: (updates: Record<string, unknown>) => void;
    getRecordNodes?: Node[];
}

// --- TRIGGER ---
function TriggerConfig({ data, updateData }: ConfigProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-medium">Trigger Type</Label>
                <Select value={(data.triggerType as string) || ""} onValueChange={(v) => updateData("triggerType", v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select trigger..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="RECORD_CREATED">Record Created</SelectItem>
                        <SelectItem value="RECORD_UPDATED">Record Updated</SelectItem>
                        <SelectItem value="RECORD_DELETED">Record Deleted</SelectItem>
                        <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                        <SelectItem value="FORM_SUBMITTED">Form Submitted</SelectItem>
                        <SelectItem value="DEAL_ROOM_OPENED">DealRoom Opened</SelectItem>
                        <SelectItem value="SENTIMENT_NEGATIVE">Negative Sentiment</SelectItem>
                        <SelectItem value="LEAD_CREATED">Lead Created</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {["RECORD_CREATED", "RECORD_UPDATED", "RECORD_DELETED"].includes(data.triggerType as string) && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Object</Label>
                    <Select value={(data.objectType as string) || ""} onValueChange={(v) => updateData("objectType", v)}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="Select object..." /></SelectTrigger>
                        <SelectContent>
                            {objectTypes.map((o) => (
                                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            {data.triggerType === "SCHEDULED" && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Schedule (Cron)</Label>
                    <Input
                        value={(data.schedule as string) || ""}
                        onChange={(e) => updateData("schedule", e.target.value)}
                        placeholder="0 9 * * 1 (Mon 9am)"
                        className="text-sm font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">Cron expression for when to run</p>
                </div>
            )}

            <div className="space-y-2">
                <Label className="text-xs font-medium">Filter Criteria</Label>
                <Textarea
                    value={(data.filterCriteria as string) || ""}
                    onChange={(e) => updateData("filterCriteria", e.target.value)}
                    placeholder='e.g., status == "NEW" AND priority == "HIGH"'
                    className="text-sm font-mono"
                    rows={3}
                />
                <p className="text-[10px] text-muted-foreground">Optional formula — only fire if TRUE</p>
            </div>
        </div>
    );
}

// --- CONDITION ---
function ConditionConfig({ data, updateData, updateNestedData }: ConfigProps) {
    const conditions = ((data.conditions || []) as Array<{
        field: string; operator: string; value: string; logic: string;
    }>);

    const addCondition = () => {
        updateData("conditions", [...conditions, { field: "", operator: "equals", value: "", logic: "AND" }]);
    };

    const updateCondition = (idx: number, key: string, value: string) => {
        const updated = [...conditions];
        (updated[idx] as Record<string, string>)[key] = value;
        updateData("conditions", updated);
    };

    const removeCondition = (idx: number) => {
        updateData("conditions", conditions.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Conditions</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addCondition}>
                    <Plus className="h-3 w-3" /> Add
                </Button>
            </div>

            {conditions.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    No conditions. Click Add to define branching logic.
                </div>
            ) : (
                <div className="space-y-3">
                    {conditions.map((cond, idx) => (
                        <div key={idx} className="space-y-2 p-3 border rounded-lg bg-muted/30">
                            {idx > 0 && (
                                <Select value={cond.logic || "AND"} onValueChange={(v) => updateCondition(idx, "logic", v)}>
                                    <SelectTrigger className="h-7 text-xs w-20"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="AND">AND</SelectItem>
                                        <SelectItem value="OR">OR</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                            <div className="flex items-center gap-2">
                                <Input
                                    value={cond.field || ""}
                                    onChange={(e) => updateCondition(idx, "field", e.target.value)}
                                    placeholder="Field name"
                                    className="text-xs flex-1"
                                />
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeCondition(idx)}>
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <Select value={cond.operator || "equals"} onValueChange={(v) => updateCondition(idx, "operator", v)}>
                                    <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {operators.map((op) => (
                                            <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {!["is_blank", "is_not_blank"].includes(cond.operator) && (
                                    <Input
                                        value={cond.value || ""}
                                        onChange={(e) => updateCondition(idx, "value", e.target.value)}
                                        placeholder="Value"
                                        className="text-xs"
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Summary preview */}
            {conditions.length > 0 && (
                <div className="p-2 rounded bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
                    <div className="text-[10px] font-medium text-amber-600 mb-1">Preview</div>
                    <code className="text-[11px] text-amber-700 dark:text-amber-300">
                        {conditions.map((c, i) => {
                            const prefix = i > 0 ? ` ${c.logic} ` : "";
                            return `${prefix}${c.field || "?"} ${c.operator} ${c.value || ""}`.trim();
                        }).join("")}
                    </code>
                </div>
            )}
        </div>
    );
}

// --- DELAY ---
function DelayConfig({ data, updateData }: ConfigProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-medium">Wait Type</Label>
                <Select value={(data.waitType as string) || "duration"} onValueChange={(v) => updateData("waitType", v)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="duration">Fixed Duration</SelectItem>
                        <SelectItem value="until_field">Until Date Field</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {(data.waitType as string) !== "until_field" ? (
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Duration</Label>
                        <Input
                            type="number"
                            min={1}
                            value={(data.duration as number) || ""}
                            onChange={(e) => updateData("duration", parseInt(e.target.value) || 0)}
                            className="text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Unit</Label>
                        <Select value={(data.unit as string) || "minutes"} onValueChange={(v) => updateData("unit", v)}>
                            <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="minutes">Minutes</SelectItem>
                                <SelectItem value="hours">Hours</SelectItem>
                                <SelectItem value="days">Days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Date Field</Label>
                    <Input
                        value={(data.untilField as string) || ""}
                        onChange={(e) => updateData("untilField", e.target.value)}
                        placeholder="e.g., due_date or follow_up_at"
                        className="text-sm font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">Pauses until this record field&apos;s date/time</p>
                </div>
            )}
        </div>
    );
}

// --- LOOP ---
function LoopConfig({ data, updateData, getRecordNodes }: ConfigProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-medium">Collection Source</Label>
                {getRecordNodes && getRecordNodes.length > 0 ? (
                    <Select value={(data.collection as string) || ""} onValueChange={(v) => updateData("collection", v)}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="Pick a source..." /></SelectTrigger>
                        <SelectContent>
                            {getRecordNodes.map((n) => (
                                <SelectItem key={n.id} value={n.id}>
                                    📦 {(n.data as Record<string, string>).label || n.id}
                                </SelectItem>
                            ))}
                            <SelectItem value="custom">Custom variable name</SelectItem>
                        </SelectContent>
                    </Select>
                ) : (
                    <Input
                        value={(data.collection as string) || ""}
                        onChange={(e) => updateData("collection", e.target.value)}
                        placeholder="Variable or node ID"
                        className="text-sm font-mono"
                    />
                )}
                <p className="text-[10px] text-muted-foreground">
                    Select a &quot;Get Records&quot; result or enter a variable
                </p>
            </div>
            <div className="space-y-2">
                <Label className="text-xs font-medium">Iterator Variable</Label>
                <Input
                    value={(data.iteratorVariable as string) || ""}
                    onChange={(e) => updateData("iteratorVariable", e.target.value)}
                    placeholder="e.g., currentItem"
                    className="text-sm font-mono"
                />
                <p className="text-[10px] text-muted-foreground">Variable name to access each item in the loop</p>
            </div>
        </div>
    );
}

// --- ACTION ---
function ActionConfig({ data, updateData, updateNestedData }: ConfigProps) {
    const actionType = (data.actionType as string) || "send_email";

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-medium">Action Type</Label>
                <Select value={actionType} onValueChange={(v) => updateData("actionType", v)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="send_email">
                            <div className="flex items-center gap-2"><Mail className="h-3 w-3" /> Send Email</div>
                        </SelectItem>
                        <SelectItem value="send_sms">
                            <div className="flex items-center gap-2"><MessageSquare className="h-3 w-3" /> Send SMS</div>
                        </SelectItem>
                        <SelectItem value="create_task">
                            <div className="flex items-center gap-2"><CheckSquare className="h-3 w-3" /> Create Task</div>
                        </SelectItem>
                        <SelectItem value="notify">
                            <div className="flex items-center gap-2"><Bell className="h-3 w-3" /> Notify</div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <Separator />

            {actionType === "send_email" && (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">To</Label>
                        <Input
                            value={(data.emailTo as string) || ""}
                            onChange={(e) => updateData("emailTo", e.target.value)}
                            placeholder="{{record.email}} or static@email.com"
                            className="text-sm font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Subject</Label>
                        <Input
                            value={(data.emailSubject as string) || ""}
                            onChange={(e) => updateData("emailSubject", e.target.value)}
                            placeholder="Hello {{record.name}}"
                            className="text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Body</Label>
                        <Textarea
                            value={(data.emailBody as string) || ""}
                            onChange={(e) => updateData("emailBody", e.target.value)}
                            placeholder="Hi {{record.name}}, your case {{record.case_number}} has been updated..."
                            className="text-sm"
                            rows={5}
                        />
                        <p className="text-[10px] text-muted-foreground">
                            Use {"{{record.field}}"} for merge fields from the triggering record
                        </p>
                    </div>
                </div>
            )}

            {actionType === "send_sms" && (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Phone Number</Label>
                        <Input
                            value={(data.smsTo as string) || ""}
                            onChange={(e) => updateData("smsTo", e.target.value)}
                            placeholder="{{record.phone}} or +1234567890"
                            className="text-sm font-mono"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Message</Label>
                        <Textarea
                            value={(data.smsBody as string) || ""}
                            onChange={(e) => updateData("smsBody", e.target.value)}
                            placeholder="Hi {{record.name}}, your order is ready..."
                            className="text-sm"
                            rows={3}
                        />
                    </div>
                </div>
            )}

            {actionType === "create_task" && (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Task Subject</Label>
                        <Input
                            value={(data.taskSubject as string) || ""}
                            onChange={(e) => updateData("taskSubject", e.target.value)}
                            placeholder="Follow up with {{record.name}}"
                            className="text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Assigned To</Label>
                        <Input
                            value={(data.taskAssignee as string) || ""}
                            onChange={(e) => updateData("taskAssignee", e.target.value)}
                            placeholder="{{record.owner_id}} or user email"
                            className="text-sm font-mono"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Due (days from now)</Label>
                            <Input
                                type="number"
                                min={0}
                                value={(data.taskDueDays as number) || ""}
                                onChange={(e) => updateData("taskDueDays", parseInt(e.target.value) || 0)}
                                className="text-sm"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-xs font-medium">Priority</Label>
                            <Select value={(data.taskPriority as string) || "MEDIUM"} onValueChange={(v) => updateData("taskPriority", v)}>
                                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="URGENT">Urgent</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Description</Label>
                        <Textarea
                            value={(data.taskDescription as string) || ""}
                            onChange={(e) => updateData("taskDescription", e.target.value)}
                            placeholder="Task details..."
                            className="text-sm"
                            rows={3}
                        />
                    </div>
                </div>
            )}

            {actionType === "notify" && (
                <div className="space-y-3">
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Notification Title</Label>
                        <Input
                            value={(data.notifyTitle as string) || ""}
                            onChange={(e) => updateData("notifyTitle", e.target.value)}
                            placeholder="New lead assigned"
                            className="text-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Message</Label>
                        <Textarea
                            value={(data.notifyBody as string) || ""}
                            onChange={(e) => updateData("notifyBody", e.target.value)}
                            placeholder="{{record.name}} needs your attention"
                            className="text-sm"
                            rows={3}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-xs font-medium">Recipients</Label>
                        <Input
                            value={(data.notifyRecipients as string) || ""}
                            onChange={(e) => updateData("notifyRecipients", e.target.value)}
                            placeholder="{{record.owner_id}} or role:ADMIN"
                            className="text-sm font-mono"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// --- UPDATE RECORD ---
function UpdateRecordConfig({ data, updateData, updateNestedData }: ConfigProps) {
    const fieldUpdates = ((data.fieldUpdates || []) as Array<{ field: string; value: string }>);

    const addFieldUpdate = () => {
        updateData("fieldUpdates", [...fieldUpdates, { field: "", value: "" }]);
    };

    const updateFieldUpdate = (idx: number, key: string, value: string) => {
        const updated = [...fieldUpdates];
        (updated[idx] as Record<string, string>)[key] = value;
        updateData("fieldUpdates", updated);
    };

    const removeFieldUpdate = (idx: number) => {
        updateData("fieldUpdates", fieldUpdates.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-medium">Operation</Label>
                <Select value={(data.operation as string) || "UPDATE"} onValueChange={(v) => updateData("operation", v)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="CREATE">Create Record</SelectItem>
                        <SelectItem value="UPDATE">Update Record</SelectItem>
                        <SelectItem value="GET">Get Records (Query)</SelectItem>
                        <SelectItem value="DELETE">Delete Record</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label className="text-xs font-medium">Object</Label>
                <Select value={(data.objectType as string) || ""} onValueChange={(v) => updateData("objectType", v)}>
                    <SelectTrigger className="text-sm"><SelectValue placeholder="Select object..." /></SelectTrigger>
                    <SelectContent>
                        {objectTypes.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Filter for GET/UPDATE/DELETE */}
            {["GET", "UPDATE", "DELETE"].includes((data.operation as string) || "UPDATE") && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Filter Criteria</Label>
                    <Textarea
                        value={(data.filterCriteria as string) || ""}
                        onChange={(e) => updateData("filterCriteria", e.target.value)}
                        placeholder='e.g., status == "NEW"'
                        className="text-sm font-mono"
                        rows={2}
                    />
                </div>
            )}

            {/* Field mappings for CREATE/UPDATE */}
            {["CREATE", "UPDATE"].includes((data.operation as string) || "UPDATE") && (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Field Values</Label>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addFieldUpdate}>
                            <Plus className="h-3 w-3" /> Add Field
                        </Button>
                    </div>
                    {fieldUpdates.map((fu, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                            <Input
                                value={fu.field}
                                onChange={(e) => updateFieldUpdate(idx, "field", e.target.value)}
                                placeholder="Field"
                                className="text-xs flex-1"
                            />
                            <span className="text-muted-foreground text-xs">→</span>
                            <Input
                                value={fu.value}
                                onChange={(e) => updateFieldUpdate(idx, "value", e.target.value)}
                                placeholder="Value or {{ref}}"
                                className="text-xs flex-1"
                            />
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive shrink-0" onClick={() => removeFieldUpdate(idx)}>
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                    {fieldUpdates.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-3 border border-dashed rounded-lg">
                            No field mappings. Click Add Field.
                        </div>
                    )}
                </div>
            )}

            {(data.operation as string) === "GET" && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Max Records</Label>
                    <Input
                        type="number"
                        min={1}
                        max={200}
                        value={(data.maxRecords as number) || 50}
                        onChange={(e) => updateData("maxRecords", parseInt(e.target.value) || 50)}
                        className="text-sm"
                    />
                </div>
            )}
        </div>
    );
}

// --- SCREEN ---
function ScreenConfig({ data, updateData }: ConfigProps) {
    const fields = ((data.fields || []) as Array<{
        name: string; type: string; label: string; required: boolean; helpText: string; defaultValue: string;
    }>);

    const addField = () => {
        updateData("fields", [...fields, {
            name: `field_${fields.length + 1}`,
            type: "text",
            label: `Field ${fields.length + 1}`,
            required: false,
            helpText: "",
            defaultValue: "",
        }]);
    };

    const updateField = (idx: number, key: string, value: unknown) => {
        const updated = [...fields];
        (updated[idx] as Record<string, unknown>)[key] = value;
        updateData("fields", updated);
    };

    const removeField = (idx: number) => {
        updateData("fields", fields.filter((_, i) => i !== idx));
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-medium">Screen Title</Label>
                <Input
                    value={(data.screenTitle as string) || ""}
                    onChange={(e) => updateData("screenTitle", e.target.value)}
                    placeholder="e.g., Contact Information"
                    className="text-sm"
                />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">Form Fields</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addField}>
                    <Plus className="h-3 w-3" /> Add Field
                </Button>
            </div>

            {fields.map((field, idx) => (
                <div key={idx} className="p-3 border rounded-lg bg-muted/30 space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                            <GripVertical className="h-3 w-3 text-muted-foreground" />
                            <Badge variant="outline" className="text-[10px]">#{idx + 1}</Badge>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeField(idx)}>
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[10px]">Label</Label>
                            <Input
                                value={field.label}
                                onChange={(e) => updateField(idx, "label", e.target.value)}
                                className="text-xs h-8"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px]">API Name</Label>
                            <Input
                                value={field.name}
                                onChange={(e) => updateField(idx, "name", e.target.value)}
                                className="text-xs h-8 font-mono"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-[10px]">Type</Label>
                            <Select value={field.type} onValueChange={(v) => updateField(idx, "type", v)}>
                                <SelectTrigger className="text-xs h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {screenFieldTypes.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[10px]">Default Value</Label>
                            <Input
                                value={field.defaultValue || ""}
                                onChange={(e) => updateField(idx, "defaultValue", e.target.value)}
                                className="text-xs h-8"
                                placeholder="Optional"
                            />
                        </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={field.required}
                                onCheckedChange={(checked) => updateField(idx, "required", checked)}
                            />
                            <Label className="text-[10px]">Required</Label>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label className="text-[10px]">Help Text</Label>
                        <Input
                            value={field.helpText || ""}
                            onChange={(e) => updateField(idx, "helpText", e.target.value)}
                            className="text-xs h-8"
                            placeholder="Guidance for the user"
                        />
                    </div>
                </div>
            ))}

            {fields.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-6 border border-dashed rounded-lg">
                    No fields yet. Add fields to collect user input.
                </div>
            )}
        </div>
    );
}

// --- APPROVAL ---
function ApprovalConfig({ data, updateData }: ConfigProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label className="text-xs font-medium">Approval Chain</Label>
                <Input
                    value={(data.processName as string) || ""}
                    onChange={(e) => updateData("processName", e.target.value)}
                    placeholder="e.g., Large Deal Approval"
                    className="text-sm"
                />
                <p className="text-[10px] text-muted-foreground">
                    Name of an existing Approval Chain, or configure inline below
                </p>
            </div>

            <Separator />

            <div className="space-y-2">
                <Label className="text-xs font-medium">Inline Approver</Label>
                <Select value={(data.approverType as string) || "ROLE"} onValueChange={(v) => updateData("approverType", v)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ROLE">By Role</SelectItem>
                        <SelectItem value="MANAGER">Manager of Record Owner</SelectItem>
                        <SelectItem value="SPECIFIC_USER">Specific User</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {(data.approverType as string) === "ROLE" && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Role</Label>
                    <Select value={(data.approverRole as string) || ""} onValueChange={(v) => updateData("approverRole", v)}>
                        <SelectTrigger className="text-sm"><SelectValue placeholder="Select role..." /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            )}

            {(data.approverType as string) === "SPECIFIC_USER" && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">User ID or Email</Label>
                    <Input
                        value={(data.approverId as string) || ""}
                        onChange={(e) => updateData("approverId", e.target.value)}
                        placeholder="user@example.com"
                        className="text-sm"
                    />
                </div>
            )}

            <div className="space-y-2">
                <Label className="text-xs font-medium">Approval Mode</Label>
                <Select value={(data.approvalMode as string) || "FIRST_RESPONSE"} onValueChange={(v) => updateData("approvalMode", v)}>
                    <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="FIRST_RESPONSE">First Response</SelectItem>
                        <SelectItem value="UNANIMOUS">Unanimous</SelectItem>
                    </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground">
                    First Response: one approval is enough. Unanimous: all must approve.
                </p>
            </div>
        </div>
    );
}
