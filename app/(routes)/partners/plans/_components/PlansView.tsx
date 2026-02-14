
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Edit, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { toast } from "react-hot-toast";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";

import { createPlan, updatePlan, deletePlan } from "@/actions/plans/plan-actions";


type Plan = {
    id: string;
    name: string;
    slug: string;
    description: string;
    price: number;
    currency: string;
    max_users: number;
    max_storage: number;
    max_credits: number;
    features: string[];
    isActive: boolean;
    billing_cycle: "MONTHLY" | "YEARLY" | "LIFETIME" | "ONE_TIME";
    grace_period_days: number;
};

type Props = {
    initialPlans: Plan[];
};

const AVAILABLE_FEATURES = [
    { id: "crm", label: "CRM (Contacts & Accounts)" },
    { id: "projects", label: "Projects & Boards" },
    { id: "documents", label: "Documents" },
    { id: "invoices", label: "Invoices & Billing" },
    { id: "reports", label: "Advanced Reporting" },
    { id: "openai", label: "AI & Automation" },
    { id: "emails", label: "Email Intelligence" },
    { id: "all", label: "All Features (Enterprise)" },
];

const PlansView = ({ initialPlans }: Props) => {
    const router = useRouter();
    const [plans, setPlans] = useState(initialPlans);
    const [isLoading, setIsLoading] = useState(false);

    // Dialog State
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<Plan>>({
        name: "",
        slug: "",
        price: 0,
        currency: "USD",
        max_users: 1,
        max_storage: 1000,
        max_credits: 0,
        features: [],
        isActive: true,
        billing_cycle: "MONTHLY",
        grace_period_days: 7,
    });

    const openCreate = () => {
        setEditingPlan(null);
        setFormData({
            name: "",
            slug: "",
            price: 0,
            currency: "USD",
            max_users: 1,
            max_storage: 1000,
            max_credits: 0,
            features: [],
            isActive: true,
            billing_cycle: "MONTHLY",
            grace_period_days: 7,
        });
        setIsDialogOpen(true);
    };

    const openEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData(plan);
        setIsDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name || !formData.slug) {
            toast.error("Name and Slug are required");
            return;
        }

        try {
            setIsLoading(true);
            let res: { error?: string; success?: string };
            if (editingPlan) {
                res = await updatePlan(editingPlan.id, formData);
            } else {
                res = await createPlan(formData);
            }

            if ('error' in res && res.error) {
                toast.error(res.error);
            } else {
                toast.success(editingPlan ? "Plan updated" : "Plan created");
                setIsDialogOpen(false);
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will not affect existing teams but will prevent new assignments.")) return;
        try {
            setIsLoading(true);
            const res = await deletePlan(id);
            if ('error' in res && res.error) {
                toast.error(res.error);
            } else {
                toast.success("Plan deleted");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to delete");
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFeature = (featureId: string) => {
        setFormData(prev => {
            const current = prev.features || [];
            if (current.includes(featureId)) {
                return { ...prev, features: current.filter(f => f !== featureId) };
            } else {
                return { ...prev, features: [...current, featureId] };
            }
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Subscription Plans</CardTitle>
                    <CardDescription>Manage available plans, limits, and pricing.</CardDescription>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Plan
                </Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Slug</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Limits (Users/GB)</TableHead>
                            <TableHead>Features</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {initialPlans.map((plan) => (
                            <TableRow key={plan.id}>
                                <TableCell className="font-medium">{plan.name}</TableCell>
                                <TableCell><Badge variant="outline">{plan.slug}</Badge></TableCell>
                                <TableCell>{plan.currency} {plan.price}/mo</TableCell>
                                <TableCell>
                                    <div className="text-sm">
                                        <div>Users: {plan.max_users}</div>
                                        <div className="text-muted-foreground">Store: {plan.max_storage}MB</div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex flex-wrap gap-1">
                                        {plan.features.includes("all") ? (
                                            <Badge variant="default">All Features</Badge>
                                        ) : (
                                            plan.features.slice(0, 3).map(f => (
                                                <Badge key={f} variant="secondary" className="text-xs">{f}</Badge>
                                            ))
                                        )}
                                        {plan.features.length > 3 && !plan.features.includes("all") && (
                                            <Badge variant="secondary" className="text-xs">+{plan.features.length - 3}</Badge>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {plan.isActive ? (
                                        <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>
                                    ) : (
                                        <Badge variant="destructive">Inactive</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openEdit(plan)}>
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(plan.id)}>
                                            <Trash className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
                        <DialogDescription>
                            Configure plan details, limits, and unlocked features.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Plan Name</Label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Pro Plan"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Slug (Unique ID)</Label>
                                <Input
                                    value={formData.slug}
                                    onChange={(e) => {
                                        const val = e.target.value
                                            .toUpperCase()
                                            .replace(/\s+/g, '-')     // Replace spaces with -
                                            .replace(/[^A-Z0-9-]/g, ''); // Remove non-alphanumeric chars
                                        setFormData({ ...formData, slug: val });
                                    }}
                                    placeholder="PRO-PLAN"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label>Price</Label>
                                <Input
                                    type="number"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Currency</Label>
                                <Input
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Billing Cycle</Label>
                                <Select
                                    value={formData.billing_cycle}
                                    onValueChange={(val: any) => setFormData({ ...formData, billing_cycle: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Cycle" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                                        <SelectItem value="YEARLY">Yearly</SelectItem>
                                        <SelectItem value="LIFETIME">Lifetime</SelectItem>
                                        <SelectItem value="ONE_TIME">One Time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Grace Period (Days)</Label>
                                <Input
                                    type="number"
                                    value={formData.grace_period_days}
                                    onChange={(e) => setFormData({ ...formData, grace_period_days: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2 flex items-end pb-2">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="active"
                                        checked={formData.isActive}
                                        onCheckedChange={(c) => setFormData({ ...formData, isActive: !!c })}
                                    />
                                    <Label htmlFor="active">Active Plan</Label>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-base font-semibold">Usage Limits</Label>
                            <div className="grid grid-cols-3 gap-4 p-4 border rounded-md bg-muted/20">
                                <div className="space-y-2">
                                    <Label>Max Users</Label>
                                    <Input
                                        type="number"
                                        value={formData.max_users}
                                        onChange={(e) => setFormData({ ...formData, max_users: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Storage (MB)</Label>
                                    <Input
                                        type="number"
                                        value={formData.max_storage}
                                        onChange={(e) => setFormData({ ...formData, max_storage: Number(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>AI Credits</Label>
                                    <Input
                                        type="number"
                                        value={formData.max_credits}
                                        onChange={(e) => setFormData({ ...formData, max_credits: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-base font-semibold">Features</Label>
                            <div className="grid grid-cols-2 gap-4 p-4 border rounded-md">
                                {AVAILABLE_FEATURES.map((feature) => (
                                    <div key={feature.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`f-${feature.id}`}
                                            checked={formData.features?.includes(feature.id)}
                                            onCheckedChange={() => toggleFeature(feature.id)}
                                        />
                                        <Label htmlFor={`f-${feature.id}`}>{feature.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save Plan"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};

export default PlansView;
