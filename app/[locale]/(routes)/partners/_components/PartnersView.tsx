
// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Users as UsersIcon, Edit, Lock, List, CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { createTeam } from "@/actions/teams/create-team";
import { seedInternalTeam } from "@/actions/teams/seed-team";
import { updateTeamRenewal } from "@/actions/teams/update-team-renewal";
import { toast } from "react-hot-toast";

type Team = {
    id: string;
    name: string;
    slug: string;
    status?: string | null;
    created_at: Date;
    renewal_date?: Date | null;
    assigned_plan?: {
        name: string;
    } | null;
    members: {
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
    }[];
};

type Props = {
    initialTeams: Team[];
    availablePlans: any[];
};

const LinkHref = Link as any;

const PartnersView = ({ initialTeams, availablePlans = [] }: Props) => {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [isLoading, setIsLoading] = useState(false);

    // Create Modal State
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [planId, setPlanId] = useState("");

    const handleCreate = async () => {
        try {
            setIsLoading(true);
            const res = await createTeam(name, slug, planId || undefined);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Team created!");
                setOpen(false);
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeed = async () => {
        try {
            setIsLoading(true);
            const res = await seedInternalTeam();
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Internal Team Seeded! Updated ${res.count} users.`);
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to seed");
        } finally {
            setIsLoading(false);
        }
    }

    // Auto-generate slug
    useEffect(() => {
        if (name) {
            setSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        }
    }, [name]);

    // Renewal Dialog State
    const [renewalOpen, setRenewalOpen] = useState(false);
    const [renewalTeam, setRenewalTeam] = useState<Team | null>(null);
    const [newRenewalDate, setNewRenewalDate] = useState("");

    const openRenewalDialog = (team: Team) => {
        setRenewalTeam(team);
        setNewRenewalDate(team.renewal_date ? new Date(team.renewal_date).toISOString().split('T')[0] : "");
        setRenewalOpen(true);
    };

    const handleUpdateRenewal = async () => {
        if (!renewalTeam) return;
        try {
            setIsLoading(true);
            const date = newRenewalDate ? new Date(newRenewalDate) : null;
            const res = await updateTeamRenewal(renewalTeam.id, date);

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Renewal date updated");
                setRenewalOpen(false);
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to update renewal date");
        } finally {
            setIsLoading(false);
        }
    };

    // Check if current user has access to manage plans (simple client check, real check is server side)
    const hasInternalTeam = teams.some(t => t.slug === 'internal' || t.slug === 'ledger1');

    const pendingCount = teams.filter(t => t.status === 'PENDING').length;

    const getStatusStyle = (status?: string | null) => {
        switch (status) {
            case "PENDING":
                return {
                    borderColor: "rgba(234,179,8, 0.8)", // Yellow-500
                    boxShadow: "0 0 15px rgba(234,179,8, 0.25), inset 0 0 10px rgba(234,179,8, 0.05)",
                    backgroundColor: "rgba(234,179,8, 0.02)"
                };
            case "SUSPENDED":
                return {
                    borderColor: "rgba(220,38,38, 0.8)", // Red-600
                    boxShadow: "0 0 15px rgba(220,38,38, 0.35), inset 0 0 10px rgba(220,38,38, 0.1)",
                    backgroundColor: "rgba(220,38,38, 0.05)"
                };
            case "OVERDUE":
                return {
                    borderColor: "rgba(236,72,153, 1)", // Pink-500
                    boxShadow: "0 0 20px rgba(236,72,153, 0.5), inset 0 0 10px rgba(236,72,153, 0.1)",
                    backgroundColor: "rgba(236,72,153, 0.05)"
                };
            case "ACTIVE":
                return {
                    borderColor: "rgba(34,197,94, 0.3)", // Green-500 low opacity
                    boxShadow: "0 0 10px rgba(34,197,94, 0.05)",
                };
            default:
                return {};
        }
    };

    // Client-side Overdue Check
    const getEffectiveStatus = (team: Team) => {
        if (team.status === "SUSPENDED") return "SUSPENDED";
        if (team.status === "PENDING") return "PENDING";

        if (team.renewal_date) {
            const now = new Date();
            const renewal = new Date(team.renewal_date);
            const gracePeriod = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

            if (now > renewal) {
                if (now.getTime() - renewal.getTime() > gracePeriod) {
                    return "SUSPENDED"; // Should be updated on server, but show as suspended here
                }
                return "OVERDUE";
            }
        }
        return team.status || "ACTIVE";
    };

    return (
        <div className="space-y-6">
            {pendingCount > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-4 flex items-center gap-4 text-destructive">
                    <div className="p-2 bg-destructive text-destructive-foreground rounded-full">
                        <UsersIcon className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="font-semibold">Action Required</h4>
                        <p className="text-sm">
                            There are <span className="font-bold">{pendingCount}</span> team(s) awaiting payment confirmation or approval.
                        </p>
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Teams & Partners</h2>
                    <p className="text-muted-foreground">Manage your organizations and their access.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSeed} disabled={isLoading}>
                        <Lock className="w-4 h-4 mr-2" />
                        Seed Internal Team
                    </Button>

                    {hasInternalTeam && (
                        <LinkHref href="/partners/plans">
                            <Button variant="outline">
                                <List className="w-4 h-4 mr-2" />
                                Manage Plans
                            </Button>
                        </LinkHref>
                    )}

                    {teams.find(t => t.slug === 'internal') && (
                        <LinkHref href={`/partners/${teams.find(t => t.slug === 'internal')?.id}`}>
                            <Button variant="secondary">
                                <UsersIcon className="w-4 h-4 mr-2" />
                                Manage Internal Team
                            </Button>
                        </LinkHref>
                    )}

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Team
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Team</DialogTitle>
                                <DialogDescription>
                                    Add a new partner organization or team instance.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Team Name</label>
                                    <Input
                                        placeholder="e.g. Acme Corp"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Brand Key (Slug)</label>
                                    <Input
                                        placeholder="e.g. acme-corp"
                                        value={slug}
                                        onChange={(e) => setSlug(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Subscription Plan</label>
                                    <Select
                                        value={planId}
                                        onValueChange={(val) => setPlanId(val)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none" disabled>Select Plan</SelectItem>
                                            {availablePlans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id}>
                                                    {plan.name} ({plan.currency} {plan.price})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={isLoading}>Create Team</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => {
                    const effectiveStatus = getEffectiveStatus(team);
                    return (
                        <Card
                            key={team.id}
                            className="transition-all duration-300 border-2"
                            style={getStatusStyle(effectiveStatus)}
                        >
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <CardTitle className="leading-tight">{team.name}</CardTitle>
                                            {effectiveStatus === "PENDING" && (
                                                <Badge variant="destructive" className="animate-pulse">Pending</Badge>
                                            )}
                                            {effectiveStatus === "SUSPENDED" && (
                                                <Badge variant="destructive">Suspended</Badge>
                                            )}
                                            {effectiveStatus === "OVERDUE" && (
                                                <Badge className="bg-pink-500 hover:bg-pink-600 animate-pulse text-white border-none">Overdue</Badge>
                                            )}
                                        </div>
                                        <CardDescription className="font-mono text-xs mt-1 text-muted-foreground/70">{team.slug}</CardDescription>
                                    </div>
                                    <Badge variant="outline" className="shrink-0">{team.members.length} Users</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex -space-x-2 overflow-hidden py-2">
                                    {team.members.slice(0, 5).map((member) => (
                                        <div key={member.id} className="h-8 w-8 rounded-full ring-2 ring-background bg-slate-200 flex items-center justify-center overflow-hidden" title={member.name || member.email}>
                                            {member.avatar ? (
                                                <img src={member.avatar} alt={member.name || "User"} className="h-full w-full object-cover" />
                                            ) : (
                                                <span className="text-xs font-semibold text-slate-500">{(member.name || member.email)[0].toUpperCase()}</span>
                                            )}
                                        </div>
                                    ))}
                                    {team.members.length > 5 && (
                                        <div className="h-8 w-8 rounded-full ring-2 ring-background bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                                            +{team.members.length - 5}
                                        </div>
                                    )}
                                    {team.members.length === 0 && (
                                        <span className="text-sm text-muted-foreground italic pl-2">No members yet</span>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between items-center border-t p-4 bg-muted/20">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground flex flex-col">
                                        <span>Since {new Date(team.created_at).toLocaleDateString()}</span>
                                        {team.renewal_date && (
                                            <span className="text-muted-foreground/70">
                                                Refreshes: {new Date(team.renewal_date).toLocaleDateString()}
                                            </span>
                                        )}
                                    </span>
                                    {team.assigned_plan && (
                                        <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-xs shadow-sm border border-slate-200 dark:border-slate-700">
                                            {team.assigned_plan.name}
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openRenewalDialog(team)}>
                                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                    <LinkHref href={`/partners/${team.id}`}>
                                        <Button variant="ghost" size="sm">
                                            <Edit className="w-4 h-4 mr-2" />
                                            Manage
                                        </Button>
                                    </LinkHref>
                                </div>
                            </CardFooter>
                        </Card>
                    );
                })}
            </div>
            {teams.length === 0 && (
                <div className="text-center py-10">
                    <h3 className="text-lg font-medium">No teams found</h3>
                    <p>Get started by creating your first team.</p>
                </div>
            )}

            {/* Renewal Dialog */}
            <Dialog open={renewalOpen} onOpenChange={setRenewalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Renewal Date</DialogTitle>
                        <DialogDescription>
                            Manually set the next renewal date for {renewalTeam?.name}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <label className="text-sm font-medium mb-2 block">Renewal Date</label>
                        <Input
                            type="date"
                            value={newRenewalDate}
                            onChange={(e) => setNewRenewalDate(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-2">
                            Clearing the date will remove the renewal schedule.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRenewalOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateRenewal} disabled={isLoading}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PartnersView;

