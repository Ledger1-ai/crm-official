"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Headset,
    Plus,
    Search,
    Filter,
    AlertTriangle,
    Clock,
    CheckCircle2,
    ArrowUpCircle,
    BarChart3,
    Inbox,
    FileText,
    X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface CasesClientProps {
    initialCases: any[];
    stats: any;
    teamMembers: any[];
    contacts: any[];
    accounts: any[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    NEW: { label: "New", color: "bg-blue-500/20 text-blue-400 border-blue-500/30", icon: Inbox },
    OPEN: { label: "Open", color: "bg-amber-500/20 text-amber-400 border-amber-500/30", icon: FileText },
    IN_PROGRESS: { label: "In Progress", color: "bg-violet-500/20 text-violet-400 border-violet-500/30", icon: Clock },
    WAITING_ON_CUSTOMER: { label: "Waiting on Customer", color: "bg-orange-500/20 text-orange-400 border-orange-500/30", icon: Clock },
    WAITING_ON_THIRD_PARTY: { label: "Waiting on 3rd Party", color: "bg-slate-500/20 text-slate-400 border-slate-500/30", icon: Clock },
    ESCALATED: { label: "Escalated", color: "bg-red-500/20 text-red-400 border-red-500/30", icon: ArrowUpCircle },
    RESOLVED: { label: "Resolved", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30", icon: CheckCircle2 },
    CLOSED: { label: "Closed", color: "bg-gray-500/20 text-gray-400 border-gray-500/30", icon: CheckCircle2 },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    LOW: { label: "Low", color: "bg-slate-500/20 text-slate-400 border-slate-500/30" },
    MEDIUM: { label: "Medium", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    HIGH: { label: "High", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
    CRITICAL: { label: "Critical", color: "bg-red-500/20 text-red-300 border-red-500/40 animate-pulse" },
};

export default function CasesClient({
    initialCases,
    stats,
    teamMembers,
    contacts,
    accounts,
}: CasesClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const [cases, setCases] = useState(initialCases);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [activeView, setActiveView] = useState<"list" | "board">("list");

    // New case form state
    const [newCase, setNewCase] = useState({
        subject: "",
        description: "",
        priority: "MEDIUM",
        origin: "WEB",
        type: "",
        contact_id: "",
        account_id: "",
        assigned_to: "",
    });

    // Filtered cases
    const filteredCases = useMemo(() => {
        return cases.filter((c: any) => {
            const matchesSearch =
                !searchQuery ||
                c.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.case_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.contact?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.contact?.last_name?.toLowerCase().includes(searchQuery.toLowerCase());

            const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
            const matchesPriority = priorityFilter === "ALL" || c.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [cases, searchQuery, statusFilter, priorityFilter]);

    // Create case handler
    const handleCreateCase = async () => {
        if (!newCase.subject.trim()) {
            toast({ title: "Error", description: "Subject is required", variant: "destructive" });
            return;
        }

        setIsCreating(true);
        try {
            const res = await fetch("/api/crm/cases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newCase),
            });

            if (!res.ok) throw new Error("Failed to create case");

            const created = await res.json();
            setCases((prev: any) => [created, ...prev]);
            setShowCreateDialog(false);
            setNewCase({
                subject: "",
                description: "",
                priority: "MEDIUM",
                origin: "WEB",
                type: "",
                contact_id: "",
                account_id: "",
                assigned_to: "",
            });
            toast({ title: "Case Created", description: `${created.case_number} created successfully` });
        } catch (error) {
            toast({ title: "Error", description: "Failed to create case", variant: "destructive" });
        } finally {
            setIsCreating(false);
        }
    };

    const getTimeSince = (date: string) => {
        const diff = Date.now() - new Date(date).getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours < 1) return `${Math.floor(diff / (1000 * 60))}m ago`;
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    return (
        <div className="flex flex-col h-full bg-background">
            {/* Header */}
            <div className="shrink-0 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="px-4 md:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20">
                                <Headset className="w-5 h-5 text-violet-400" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold tracking-tight">Service Console</h1>
                                <p className="text-xs text-muted-foreground">Case Management & Support Operations</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowCreateDialog(true)}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New Case
                        </Button>
                    </div>

                    {/* Stats Bar */}
                    {stats && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
                            {[
                                { label: "Open Cases", value: stats.openCases, icon: Inbox, gradient: "from-blue-500/10 to-cyan-500/10 border-blue-500/20", textColor: "text-blue-400" },
                                { label: "Critical", value: stats.criticalCases, icon: AlertTriangle, gradient: "from-red-500/10 to-rose-500/10 border-red-500/20", textColor: "text-red-400" },
                                { label: "SLA Breached", value: stats.slaBreach, icon: ArrowUpCircle, gradient: "from-orange-500/10 to-amber-500/10 border-orange-500/20", textColor: "text-orange-400" },
                                { label: "Resolved Today", value: stats.resolvedToday, icon: CheckCircle2, gradient: "from-emerald-500/10 to-green-500/10 border-emerald-500/20", textColor: "text-emerald-400" },
                                { label: "New Today", value: stats.newToday, icon: FileText, gradient: "from-violet-500/10 to-purple-500/10 border-violet-500/20", textColor: "text-violet-400" },
                                { label: "Total Cases", value: stats.totalCases, icon: BarChart3, gradient: "from-slate-500/10 to-gray-500/10 border-slate-500/20", textColor: "text-slate-400" },
                            ].map((stat, i) => (
                                <div key={i} className={cn("rounded-lg border p-3 bg-gradient-to-br", stat.gradient)}>
                                    <div className="flex items-center gap-2 mb-1">
                                        <stat.icon className={cn("w-3.5 h-3.5", stat.textColor)} />
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</span>
                                    </div>
                                    <span className={cn("text-2xl font-bold tabular-nums", stat.textColor)}>{stat.value ?? 0}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Filters */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[200px] max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search cases..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-muted/30 border-border/50"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px] bg-muted/30 border-border/50">
                                <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Statuses</SelectItem>
                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-[150px] bg-muted/30 border-border/50">
                                <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Priorities</SelectItem>
                                {Object.entries(PRIORITY_CONFIG).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Cases List */}
            <div className="flex-1 overflow-auto px-4 md:px-6 lg:px-8 py-4">
                {filteredCases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                        <Headset className="w-12 h-12 mb-4 opacity-30" />
                        <p className="text-lg font-medium">No cases found</p>
                        <p className="text-sm">Create your first support case to get started</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredCases.map((c: any) => {
                            const statusCfg = STATUS_CONFIG[c.status] || STATUS_CONFIG.NEW;
                            const priorityCfg = PRIORITY_CONFIG[c.priority] || PRIORITY_CONFIG.MEDIUM;
                            const StatusIcon = statusCfg.icon;

                            return (
                                <div
                                    key={c.id}
                                    onClick={() => router.push(`/crm/cases/${c.id}`)}
                                    className={cn(
                                        "group relative flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200",
                                        "bg-card/50 hover:bg-card border-border/50 hover:border-border hover:shadow-lg hover:shadow-primary/5",
                                        c.sla_breached && "border-red-500/30 bg-red-500/5"
                                    )}
                                >
                                    {/* Priority indicator bar */}
                                    <div className={cn(
                                        "absolute left-0 top-3 bottom-3 w-1 rounded-r-full transition-all",
                                        c.priority === "CRITICAL" ? "bg-red-500" :
                                            c.priority === "HIGH" ? "bg-orange-500" :
                                                c.priority === "MEDIUM" ? "bg-blue-500" : "bg-slate-500"
                                    )} />

                                    <div className="flex-1 min-w-0 pl-3">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-mono text-muted-foreground">{c.case_number}</span>
                                            <Badge className={cn("text-[10px] border", statusCfg.color)}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {statusCfg.label}
                                            </Badge>
                                            <Badge className={cn("text-[10px] border", priorityCfg.color)}>
                                                {priorityCfg.label}
                                            </Badge>
                                            {c.sla_breached && (
                                                <Badge className="text-[10px] bg-red-500/20 text-red-400 border-red-500/30 border animate-pulse">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    SLA Breached
                                                </Badge>
                                            )}
                                        </div>
                                        <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                                            {c.subject}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                            {c.contact && (
                                                <span>{c.contact.first_name} {c.contact.last_name}</span>
                                            )}
                                            {c.account && (
                                                <span className="text-muted-foreground/60">• {c.account.name}</span>
                                            )}
                                            <span className="text-muted-foreground/60">• {getTimeSince(c.createdAt)}</span>
                                            {c._count?.comments > 0 && (
                                                <span className="text-muted-foreground/60">• {c._count.comments} comments</span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Assigned user avatar */}
                                    <div className="shrink-0 flex items-center gap-2">
                                        {c.assigned_user ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                                    {c.assigned_user.name?.charAt(0) || c.assigned_user.email?.charAt(0) || "?"}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center">
                                                <span className="text-[10px] text-muted-foreground">–</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Create Case Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Plus className="w-5 h-5 text-violet-400" />
                            Create New Case
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Subject *</label>
                            <Input
                                placeholder="Brief description of the issue..."
                                value={newCase.subject}
                                onChange={(e) => setNewCase({ ...newCase, subject: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-1.5 block">Description</label>
                            <Textarea
                                placeholder="Detailed description..."
                                rows={4}
                                value={newCase.description}
                                onChange={(e) => setNewCase({ ...newCase, description: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Priority</label>
                                <Select value={newCase.priority} onValueChange={(v) => setNewCase({ ...newCase, priority: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Low</SelectItem>
                                        <SelectItem value="MEDIUM">Medium</SelectItem>
                                        <SelectItem value="HIGH">High</SelectItem>
                                        <SelectItem value="CRITICAL">Critical</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Origin</label>
                                <Select value={newCase.origin} onValueChange={(v) => setNewCase({ ...newCase, origin: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="EMAIL">Email</SelectItem>
                                        <SelectItem value="PHONE">Phone</SelectItem>
                                        <SelectItem value="WEB">Web</SelectItem>
                                        <SelectItem value="CHAT">Chat</SelectItem>
                                        <SelectItem value="PORTAL">Portal</SelectItem>
                                        <SelectItem value="INTERNAL">Internal</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Type</label>
                                <Select value={newCase.type} onValueChange={(v) => setNewCase({ ...newCase, type: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="QUESTION">Question</SelectItem>
                                        <SelectItem value="PROBLEM">Problem</SelectItem>
                                        <SelectItem value="INCIDENT">Incident</SelectItem>
                                        <SelectItem value="FEATURE_REQUEST">Feature Request</SelectItem>
                                        <SelectItem value="TASK">Task</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Assign To</label>
                                <Select value={newCase.assigned_to} onValueChange={(v) => setNewCase({ ...newCase, assigned_to: v })}>
                                    <SelectTrigger><SelectValue placeholder="Select agent" /></SelectTrigger>
                                    <SelectContent>
                                        {teamMembers.map((m) => (
                                            <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Contact</label>
                                <Select value={newCase.contact_id} onValueChange={(v) => setNewCase({ ...newCase, contact_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Link contact" /></SelectTrigger>
                                    <SelectContent>
                                        {contacts.map((c: any) => (
                                            <SelectItem key={c.id} value={c.id}>
                                                {c.first_name} {c.last_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Account</label>
                                <Select value={newCase.account_id} onValueChange={(v) => setNewCase({ ...newCase, account_id: v })}>
                                    <SelectTrigger><SelectValue placeholder="Link account" /></SelectTrigger>
                                    <SelectContent>
                                        {accounts.map((a: any) => (
                                            <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
                        <Button
                            onClick={handleCreateCase}
                            disabled={isCreating}
                            className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white"
                        >
                            {isCreating ? "Creating..." : "Create Case"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
