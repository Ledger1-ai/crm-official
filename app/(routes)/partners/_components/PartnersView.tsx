
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Users as UsersIcon, Edit, CalendarClock, Lock, Search, Filter, ArrowUpDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

import { updateTeamRenewal } from "@/actions/teams/update-team-renewal";
import { seedInternalTeam } from "@/actions/teams/seed-team";
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
    team_subscriptions?: {
        status: string;
        next_billing_date: Date;
    }[];
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

import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import { useIsMobile } from "@/hooks/use-is-mobile";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const LinkHref = Link as any;

const PartnersView = ({ initialTeams, availablePlans = [] }: Props) => {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>(initialTeams);

    useEffect(() => {
        setTeams(initialTeams);
    }, [initialTeams]);

    const [isLoading, setIsLoading] = useState(false);
    const [viewMode, setViewMode] = useState<ViewMode>("card");

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [sortOrder, setSortOrder] = useState("newest");

    const isMobile = useIsMobile();

    useEffect(() => {
        if (isMobile) {
            setViewMode("card");
        }
    }, [isMobile]);

    // Create Modal State
    // Logic moved to CreateTeamCard component






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
    const hasInternalTeam = teams.some(t => t.slug === 'internal' || t.slug === 'ledger1' || t.slug === 'basalt' || t.slug === 'basalthq');

    // Show all teams including internal ones
    const filteredTeams = teams.map(team => ({
        ...team,
        effectiveStatus: getEffectiveStatus(team)
    })).filter(team => {
        // Search Filter
        const matchesSearch =
            team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.slug.toLowerCase().includes(searchTerm.toLowerCase());

        // Status Filter
        let matchesStatus = true;
        if (statusFilter !== "ALL") {
            const status = team.effectiveStatus;
            if (statusFilter === "ACTIVE") matchesStatus = status === "ACTIVE";
            else if (statusFilter === "PENDING") matchesStatus = status === "PENDING";
            else if (statusFilter === "SUSPENDED") matchesStatus = status === "SUSPENDED";
            else if (statusFilter === "OVERDUE") matchesStatus = status === "OVERDUE";
        }

        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        if (sortOrder === "newest") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortOrder === "oldest") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortOrder === "alphabetical") return a.name.localeCompare(b.name);
        if (sortOrder === "members") return b.members.length - a.members.length;
        return 0;
    });

    const pendingCount = filteredTeams.filter(t => t.effectiveStatus === 'PENDING').length;

    // Platform Highlight Logic (Green, Yellow, Red)
    const getStatusStyle = (status?: string | null) => {
        switch (status) {
            case "PENDING":
                return {
                    borderColor: "#eab308", // Yellow-500
                    boxShadow: "0 0 15px rgba(234,179,8, 0.2)",
                    backgroundColor: "rgba(234,179,8, 0.05)"
                };
            case "OVERDUE":
                return {
                    borderColor: "#facc15", // Bright Yellow
                    boxShadow: "0 0 20px rgba(250,204,21, 0.3)",
                    backgroundColor: "rgba(250,204,21, 0.1)"
                };
            case "SUSPENDED":
                return {
                    borderColor: "#dc2626", // Red-600
                    boxShadow: "0 0 20px rgba(220,38,38, 0.4)",
                    backgroundColor: "rgba(220,38,38, 0.1)"
                };
            case "ACTIVE":
                return {
                    borderColor: "#22c55e", // Green-500
                    boxShadow: "0 0 15px rgba(34,197,94, 0.2)",
                    backgroundColor: "rgba(34,197,94, 0.05)"
                };
            default:
                return {
                    borderColor: "#27272a", // Zinc-800
                };
        }
    };

    /**
     * Logic for coloring:
     * Green: Paid/Active
     * Yellow: Missed payment (OVERDUE)
     * Red: Missed payment after 3 days (SUSPENDED)
     */
    function getEffectiveStatus(team: Team) {
        // 1. Manually suspended?
        if (team.status === "SUSPENDED") return "SUSPENDED";

        // 2. Check Subscription Records
        const sub = (team as any).team_subscriptions?.[0];
        if (sub) {
            return sub.status; // ACTIVE, OVERDUE, SUSPENDED
        }

        // 3. Fallback to legacy renewal logic if no subscription record found
        if (team.renewal_date) {
            const now = new Date();
            const renewal = new Date(team.renewal_date);
            const gracePeriod = 3 * 24 * 60 * 60 * 1000; // 3 days as requested

            if (now > renewal) {
                if (now.getTime() - renewal.getTime() > gracePeriod) {
                    return "SUSPENDED";
                }
                return "OVERDUE";
            }
        }

        return team.status || "ACTIVE";
    };

    const getDisplayPlan = (team: Team) => {
        const isExempt = ['basalt', 'basalthq', 'ledger1'].includes(team.slug.toLowerCase());
        const sub = (team as any).team_subscriptions?.[0];

        if (isExempt) return "Exempt";
        if (sub?.plan_name === "PLATFORM_ADMIN") return "Platform Admin";

        if (team.assigned_plan?.name) return team.assigned_plan.name;
        if (sub?.plan_name) return sub.plan_name;

        return null;
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
            <div className="flex flex-col md:flex-row justify-end items-start md:items-center gap-4">
                <div className="flex flex-wrap gap-2">
                </div>
                {/* View Toggle */}
                <div className="flex items-center ml-2">
                    <ViewToggle value={viewMode} onChange={setViewMode} />
                </div>
            </div>

            {/* Search & Filter Bar - Condensed */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-zinc-900/40 p-3 rounded-xl border border-white/5">
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground/50 h-3.5 w-3.5" />
                    <Input
                        placeholder="Search teams..."
                        className="pl-9 h-9 bg-zinc-900/50 border-white/5 text-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
                <div className="flex gap-2 w-full md:w-auto ml-auto">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[130px] h-9 bg-zinc-900/50 border-white/5 text-xs">
                            <Filter className="w-3.5 h-3.5 mr-2 opacity-50" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Statuses</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="SUSPENDED">Suspended</SelectItem>
                            <SelectItem value="OVERDUE">Overdue</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={sortOrder} onValueChange={setSortOrder}>
                        <SelectTrigger className="w-[150px] h-9 bg-zinc-900/50 border-white/5 text-xs">
                            <ArrowUpDown className="w-3.5 h-3.5 mr-2 opacity-50" />
                            <SelectValue placeholder="Sort By" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="oldest">Oldest First</SelectItem>
                            <SelectItem value="alphabetical">Alphabetical</SelectItem>
                            <SelectItem value="members">Member Count</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>


            {viewMode === "table" ? (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead>Renewal</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredTeams.map((team) => (
                                <TableRow key={team.id}>
                                    <TableCell className="font-medium">
                                        <div>{team.name}</div>
                                        <div className="text-xs text-muted-foreground">{team.slug}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={team.effectiveStatus === "ACTIVE" ? "default" : "secondary"}>
                                            {team.effectiveStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{team.members.length} Users</TableCell>
                                    <TableCell>
                                        {team.renewal_date ? new Date(team.renewal_date).toLocaleDateString() : "N/A"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openRenewalDialog(team)}>
                                                <CalendarClock className="h-4 w-4 text-muted-foreground" />
                                            </Button>
                                            <LinkHref href={`/partners/${team.id}`}>
                                                <Button variant="ghost" size="sm">Manage</Button>
                                            </LinkHref>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredTeams.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No teams found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                <div className={`grid gap-6 ${viewMode === "compact" ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}>
                    {filteredTeams.map((team) => {
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
                                                    <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-500 border-yellow-500/20">Pending</Badge>
                                                )}
                                                {effectiveStatus === "SUSPENDED" && (
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <Badge variant="destructive" className="bg-red-500 text-white">Suspended</Badge>
                                                        {(team as any).suspension_reason && (
                                                            <span className="text-[10px] text-red-400 font-medium italic">{(team as any).suspension_reason}</span>
                                                        )}
                                                    </div>
                                                )}
                                                {effectiveStatus === "OVERDUE" && (
                                                    <Badge className="bg-yellow-400 text-black border-none animate-pulse shadow-[0_0_10px_rgba(250,204,21,0.5)]">Overdue</Badge>
                                                )}
                                                {effectiveStatus === "ACTIVE" && (
                                                    <Badge className="bg-green-500 text-white border-none">Active</Badge>
                                                )}
                                                {(team as any).team_subscriptions?.[0]?.customer_wallet && (
                                                    <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 text-[8px] h-4">Hybrid</Badge>
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
                                            <div key={member.id} className="h-8 w-8 rounded-full ring-2 ring-background bg-primary/10 flex items-center justify-center overflow-hidden" title={member.name || member.email}>
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.name || "User"} className="h-full w-full object-cover" />
                                                ) : (
                                                    <span className="text-xs font-semibold text-primary/80">{(member.name || member.email)[0].toUpperCase()}</span>
                                                )}
                                            </div>
                                        ))}
                                        {team.members.length > 5 && (
                                            <div className="h-8 w-8 rounded-full ring-2 ring-background bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
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
                                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs shadow-sm">
                                            {getDisplayPlan(team) || "Free"}
                                        </Badge>
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
            )}
            {filteredTeams.length === 0 && (
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

