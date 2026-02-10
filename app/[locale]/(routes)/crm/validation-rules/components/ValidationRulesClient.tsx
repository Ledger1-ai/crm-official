"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Plus, Trash2, Edit, ToggleLeft, ToggleRight, TestTube, Loader2,
    FileText, Shield, AlertTriangle, Code, ChevronDown
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
    Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
    createValidationRule, updateValidationRule,
    deleteValidationRule, toggleValidationRule
} from "@/actions/crm/validation-rules";
import { testFormula } from "@/lib/validation-engine";

interface ValidationRule {
    id: string;
    name: string;
    description: string | null;
    is_active: boolean;
    object_type: string;
    formula: string;
    error_message: string;
    trigger_on: string;
    order: number;
    createdAt: Date;
    updatedAt: Date;
    creator: { id: string; name: string | null; avatar: string | null } | null;
}

interface Props {
    rules: ValidationRule[];
    teamId: string;
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

const formulaExamples = [
    { formula: "ISBLANK(email)", description: "Error if email is empty" },
    { formula: "close_date < NOW()", description: "Error if close date is in the past" },
    { formula: "discount > 30", description: "Error if discount exceeds 30%" },
    { formula: "status == 'CLOSED' AND ISBLANK(resolution)", description: "Error if closed without resolution" },
    { formula: "NOT CONTAINS(email, '@')", description: "Error if email is invalid" },
    { formula: "LEN(description) < 10", description: "Error if description is too short" },
];

export function ValidationRulesClient({ rules, teamId }: Props) {
    const router = useRouter();
    const [createOpen, setCreateOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [loading, setLoading] = useState<string | null>(null);
    const [testOpen, setTestOpen] = useState(false);
    const [testFormulaSt, setTestFormulaSt] = useState("");
    const [testData, setTestData] = useState("{}");
    const [testResult, setTestResult] = useState<{ result: unknown; error?: string } | null>(null);

    // Create form state
    const [formName, setFormName] = useState("");
    const [formDesc, setFormDesc] = useState("");
    const [formObject, setFormObject] = useState("");
    const [formFormula, setFormFormula] = useState("");
    const [formError, setFormError] = useState("");
    const [formTrigger, setFormTrigger] = useState("SAVE");

    const resetForm = () => {
        setFormName(""); setFormDesc(""); setFormObject("");
        setFormFormula(""); setFormError(""); setFormTrigger("SAVE");
    };

    const handleCreate = async () => {
        if (!formName || !formObject || !formFormula || !formError) {
            toast.error("Please fill in all required fields");
            return;
        }
        setLoading("create");
        const result = await createValidationRule({
            name: formName,
            description: formDesc || undefined,
            object_type: formObject,
            formula: formFormula,
            error_message: formError,
            trigger_on: formTrigger,
            team_id: teamId,
        });
        if (result.success) {
            toast.success("Guard rule created");
            setCreateOpen(false);
            resetForm();
            router.refresh();
        } else {
            toast.error(result.error || "Failed to create");
        }
        setLoading(null);
    };

    const handleToggle = async (id: string) => {
        setLoading(id);
        const result = await toggleValidationRule(id);
        if (result.success) {
            toast.success("Rule toggled");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to toggle");
        }
        setLoading(null);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        setLoading(deleteId);
        const result = await deleteValidationRule(deleteId);
        if (result.success) {
            toast.success("Rule deleted");
            router.refresh();
        } else {
            toast.error(result.error || "Failed to delete");
        }
        setDeleteId(null);
        setLoading(null);
    };

    const handleTest = () => {
        try {
            const data = JSON.parse(testData);
            const result = testFormula(testFormulaSt, data);
            setTestResult(result);
        } catch {
            setTestResult({ result: null, error: "Invalid JSON in test data" });
        }
    };

    // Group by object type
    const grouped = rules.reduce<Record<string, ValidationRule[]>>((acc, rule) => {
        const key = rule.object_type;
        if (!acc[key]) acc[key] = [];
        acc[key].push(rule);
        return acc;
    }, {});

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Badge variant="outline">{rules.length} rule{rules.length !== 1 ? "s" : ""}</Badge>
                    <Badge variant="secondary">
                        {rules.filter(r => r.is_active).length} active
                    </Badge>
                </div>
                <div className="flex gap-2">
                    <Dialog open={testOpen} onOpenChange={setTestOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <TestTube className="h-4 w-4" />
                                Formula Tester
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[520px]">
                            <DialogHeader>
                                <DialogTitle>Formula Tester</DialogTitle>
                                <DialogDescription>
                                    Test a formula against sample data to see if it evaluates correctly.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Formula</Label>
                                    <Input
                                        placeholder="e.g., ISBLANK(email) OR discount > 30"
                                        value={testFormulaSt}
                                        onChange={(e) => setTestFormulaSt(e.target.value)}
                                        className="font-mono text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Test Data (JSON)</Label>
                                    <Textarea
                                        placeholder='{"email": "", "discount": 35}'
                                        value={testData}
                                        onChange={(e) => setTestData(e.target.value)}
                                        className="font-mono text-sm"
                                        rows={4}
                                    />
                                </div>
                                <Button onClick={handleTest} className="w-full gap-2">
                                    <Code className="h-4 w-4" />
                                    Evaluate
                                </Button>
                                {testResult && (
                                    <div className={`p-3 rounded-lg border ${testResult.error
                                        ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                                        : testResult.result
                                            ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                                            : "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                                        }`}>
                                        {testResult.error ? (
                                            <div className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4" />
                                                Error: {testResult.error}
                                            </div>
                                        ) : (
                                            <div className="text-sm">
                                                <span className="font-medium">Result: </span>
                                                <code className="font-mono">{String(testResult.result)}</code>
                                                <div className="text-xs mt-1 text-muted-foreground">
                                                    {testResult.result
                                                        ? "⚠️ Formula evaluates to TRUE — validation would FAIL (record blocked)"
                                                        : "✅ Formula evaluates to FALSE — validation passes (record allowed)"
                                                    }
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="h-4 w-4" />
                                New Rule
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[560px]">
                            <DialogHeader>
                                <DialogTitle>Create Guard Rule</DialogTitle>
                                <DialogDescription>
                                    Define a formula that — when TRUE — blocks the record from being saved.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Rule Name *</Label>
                                    <Input
                                        placeholder="e.g., Close Date Must Be Future"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Textarea
                                        placeholder="When does this rule apply?"
                                        value={formDesc}
                                        onChange={(e) => setFormDesc(e.target.value)}
                                        rows={2}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                        <Label>Object *</Label>
                                        <Select value={formObject} onValueChange={setFormObject}>
                                            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                                            <SelectContent>
                                                {objectTypes.map(o => (
                                                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Trigger On</Label>
                                        <Select value={formTrigger} onValueChange={setFormTrigger}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SAVE">Create & Update</SelectItem>
                                                <SelectItem value="CREATE_ONLY">Create Only</SelectItem>
                                                <SelectItem value="UPDATE_ONLY">Update Only</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Formula (TRUE = Error) *</Label>
                                    <Textarea
                                        placeholder="e.g., close_date < NOW()"
                                        value={formFormula}
                                        onChange={(e) => setFormFormula(e.target.value)}
                                        className="font-mono text-sm"
                                        rows={3}
                                    />
                                    <Collapsible>
                                        <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                                            <ChevronDown className="h-3 w-3" />
                                            Formula examples
                                        </CollapsibleTrigger>
                                        <CollapsibleContent className="mt-2">
                                            <div className="grid gap-1.5">
                                                {formulaExamples.map((ex, i) => (
                                                    <button
                                                        key={i}
                                                        type="button"
                                                        className="text-left p-2 rounded bg-muted/50 hover:bg-muted transition-colors"
                                                        onClick={() => setFormFormula(ex.formula)}
                                                    >
                                                        <code className="text-xs font-mono text-primary">{ex.formula}</code>
                                                        <div className="text-[11px] text-muted-foreground">{ex.description}</div>
                                                    </button>
                                                ))}
                                            </div>
                                        </CollapsibleContent>
                                    </Collapsible>
                                </div>
                                <div className="space-y-2">
                                    <Label>Error Message *</Label>
                                    <Input
                                        placeholder="e.g., Close Date cannot be in the past"
                                        value={formError}
                                        onChange={(e) => setFormError(e.target.value)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreate} disabled={loading === "create"}>
                                    {loading === "create" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Create Rule
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {rules.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh] text-center">
                    <div className="p-4 bg-muted rounded-full mb-4">
                        <Shield className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h2 className="text-xl font-semibold mb-2">No guard rules yet</h2>
                    <p className="text-muted-foreground mb-6 max-w-md">
                        Create guard rules to enforce data quality. Rules use formulas to check conditions
                        and block record saves when data is invalid.
                    </p>
                    <Button size="lg" className="gap-2" onClick={() => setCreateOpen(true)}>
                        <Plus className="h-5 w-5" />
                        Create Your First Rule
                    </Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(grouped).map(([objType, objRules]) => (
                        <div key={objType}>
                            <div className="flex items-center gap-2 mb-3">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    {objectTypeLabels[objType] || objType}
                                </h3>
                                <Badge variant="outline" className="text-xs">
                                    {objRules.length}
                                </Badge>
                            </div>
                            <div className="grid gap-3">
                                {objRules.map(rule => (
                                    <Card key={rule.id} className={`transition-all ${!rule.is_active ? "opacity-50" : ""}`}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1 mr-4">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold">{rule.name}</span>
                                                        <Badge variant={rule.is_active ? "default" : "secondary"} className="text-xs">
                                                            {rule.is_active ? "Active" : "Inactive"}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-xs">
                                                            {rule.trigger_on === "SAVE" ? "Create & Update"
                                                                : rule.trigger_on === "CREATE_ONLY" ? "Create Only"
                                                                    : "Update Only"}
                                                        </Badge>
                                                    </div>
                                                    {rule.description && (
                                                        <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                                                    )}
                                                    <div className="flex flex-col gap-1.5">
                                                        <div className="flex items-center gap-2">
                                                            <Code className="h-3 w-3 text-primary" />
                                                            <code className="text-xs font-mono bg-muted px-2 py-0.5 rounded">
                                                                {rule.formula}
                                                            </code>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <AlertTriangle className="h-3 w-3 text-red-500" />
                                                            <span className="text-xs text-red-600 dark:text-red-400">
                                                                {rule.error_message}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8"
                                                        onClick={() => handleToggle(rule.id)}
                                                        disabled={loading === rule.id}
                                                        title={rule.is_active ? "Deactivate" : "Activate"}
                                                    >
                                                        {rule.is_active
                                                            ? <ToggleRight className="h-4 w-4 text-green-500" />
                                                            : <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                                                        }
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive"
                                                        onClick={() => setDeleteId(rule.id)}
                                                        disabled={loading === rule.id}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Guard Rule?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. Records will no longer be validated against this rule.
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
