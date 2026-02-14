"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

import { updateTeam } from "@/actions/teams/update-team";
import { deleteTeam } from "@/actions/teams/delete-team";
import AlertModal from "@/components/modals/alert-modal";

type Team = {
    id: string;
    name: string;
    slug: string;
    owner_id: string | null;
    members: any[];
    subscription_plan?: "FREE" | "TEAM" | "ENTERPRISE";
    plan_id?: string | null;
    status?: string | null;
    suspension_reason?: string | null;
};

import { updateTeamStatus } from "@/actions/teams/update-status";
import { AlertTriangle, CheckCircle, Ban } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TeamStatusCard = ({ teamId, currentStatus, currentReason }: { teamId: string, currentStatus?: string | null, currentReason?: string | null }) => {
    const router = useRouter();
    const [status, setStatus] = useState(currentStatus || "ACTIVE");
    const [reason, setReason] = useState(currentReason || "");
    const [isLoading, setIsLoading] = useState(false);

    const handleStatusUpdate = async () => {
        try {
            setIsLoading(true);
            const res = await updateTeamStatus(teamId, status as any, reason);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(res.success || "Status updated successfully");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to update status");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="bg-zinc-900/40 border border-[#27272a] overflow-hidden flex flex-col justify-between">
            <CardHeader className="py-4 px-6 border-b border-white/5">
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle className="text-base font-bold">Access Control</CardTitle>
                        <CardDescription className="text-[11px]">Control team access and activation status.</CardDescription>
                    </div>
                    <Badge variant={status === "ACTIVE" ? "default" : status === "PENDING" ? "secondary" : "destructive"} className="uppercase tracking-wider text-[9px] h-5 px-2">
                        {status || "UNKNOWN"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4 py-6 px-6">
                <div className="flex flex-col gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Status</label>
                        <Select value={status} onValueChange={(val) => setStatus(val)}>
                            <SelectTrigger className="h-9 bg-zinc-900/50 border-white/5 text-sm">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ACTIVE">
                                    <div className="flex items-center">
                                        <CheckCircle className="w-3.5 h-3.5 mr-2 text-green-500" />
                                        Active
                                    </div>
                                </SelectItem>
                                <SelectItem value="PENDING">
                                    <div className="flex items-center">
                                        <AlertTriangle className="w-3.5 h-3.5 mr-2 text-yellow-500" />
                                        Pending
                                    </div>
                                </SelectItem>
                                <SelectItem value="SUSPENDED">
                                    <div className="flex items-center">
                                        <Ban className="w-3.5 h-3.5 mr-2 text-red-500" />
                                        Suspended
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {status === "SUSPENDED" && (
                        <div className="space-y-1.5 animate-in slide-in-from-left-2 duration-300">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Suspension Reason</label>
                            <Select value={reason} onValueChange={setReason}>
                                <SelectTrigger className="h-9 bg-zinc-900/50 border-white/5 text-sm">
                                    <SelectValue placeholder="Select a reason" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Billing Issue">Suspended - Billing</SelectItem>
                                    <SelectItem value="Dormant Account">Suspended - Dormant</SelectItem>
                                    <SelectItem value="Usage Violation">Suspended - Violation</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter className="py-2.5 px-6 border-t border-white/5 bg-white/5 flex justify-end">
                <Button onClick={handleStatusUpdate} disabled={isLoading} variant="ghost" size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider hover:bg-white/10">
                    Update Status
                </Button>
            </CardFooter>
        </Card>
    );

};

type Props = {
    team: Team;
    availablePlans?: any[];
};

const TeamSettingsForm = ({ team, availablePlans = [] }: Props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: team.name,
        slug: team.slug,
        owner_id: team.owner_id || "", // ensure string
        subscription_plan: team.subscription_plan || "FREE",
        plan_id: team.plan_id || "",
    });

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const res = await updateTeam(team.id, {
                name: formData.name,
                slug: formData.slug,
                owner_id: formData.owner_id || undefined,
                subscription_plan: formData.subscription_plan as any,
                plan_id: formData.plan_id || undefined
            });

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Team settings saved!");
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsLoading(true);
            const res = await deleteTeam(team.id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Team deleted");
                router.push("/partners");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to delete");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <Card className="bg-zinc-900/40 border border-[#27272a] overflow-hidden">
                <CardHeader className="py-4 px-6 border-b border-white/5">
                    <div>
                        <CardTitle className="text-base font-bold">Team Profile</CardTitle>
                        <CardDescription className="text-[11px]">
                            Update core team details and subscription plan.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6 pb-6 px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Team Name</label>
                            <Input
                                value={formData.name}
                                className="h-9 bg-zinc-900/50 border-white/5 text-sm"
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Brand Key (Slug)</label>
                            <Input
                                value={formData.slug}
                                className="h-9 bg-zinc-900/50 border-white/5 font-mono text-xs"
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Owner</label>
                            <Select
                                value={formData.owner_id || undefined}
                                onValueChange={(val) => setFormData({ ...formData, owner_id: val })}
                            >
                                <SelectTrigger className="h-9 bg-zinc-900/50 border-white/5 text-sm">
                                    <SelectValue placeholder="Select owner" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled>Select Owner</SelectItem>
                                    {team.members.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.name || member.email}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest pl-1">Plan</label>
                            <Select
                                value={formData.plan_id}
                                onValueChange={(val) => setFormData({ ...formData, plan_id: val })}
                            >
                                <SelectTrigger className="h-9 bg-zinc-900/50 border-white/5 text-sm">
                                    <SelectValue placeholder="Select Plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none" disabled>Select Plan</SelectItem>
                                    {availablePlans.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id}>
                                            {plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="py-2.5 px-6 border-t border-white/5 bg-white/5 flex justify-end">
                    <Button onClick={handleSave} disabled={isLoading} size="sm" className="h-8 text-[10px] font-bold uppercase tracking-wider">
                        <Save className="w-3.5 h-3.5 mr-2" />
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TeamStatusCard teamId={team.id} currentStatus={team.status} currentReason={team.suspension_reason} />

                <Card className="bg-red-500/5 border border-red-500/20 overflow-hidden flex flex-col justify-between">
                    <CardHeader className="py-4 px-6">
                        <div className="flex flex-row items-center justify-between gap-4">
                            <div>
                                <CardTitle className="text-base font-bold text-red-500">Danger Zone</CardTitle>
                                <CardDescription className="text-[10px] text-red-500/60 leading-relaxed uppercase tracking-wide">
                                    Permanently delete team and all associated data records.
                                </CardDescription>
                            </div>
                            <AlertModal
                                isOpen={open}
                                onClose={() => setOpen(false)}
                                onConfirm={handleDelete}
                                loading={isLoading}
                                title="Are you sure you want to delete this team?"
                                description="This action cannot be undone. This will permanently delete the team and remove all data."
                            />
                        </div>
                    </CardHeader>
                    <div className="px-6 pb-6 mt-auto">
                        <Button variant="destructive" size="sm" className="w-full h-8 text-[10px] font-bold uppercase tracking-wider" onClick={() => setOpen(true)} disabled={isLoading}>
                            Delete Team
                        </Button>
                    </div>
                </Card>
            </div>
        </div>

    );
};

export default TeamSettingsForm;
