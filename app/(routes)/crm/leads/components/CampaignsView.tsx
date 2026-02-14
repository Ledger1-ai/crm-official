"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Plus, Mail, MessageSquare, Phone, TrendingUp, Users,
    Eye, Calendar, BarChart3, Filter,
    Search, MoreVertical, Play, Pause, Archive, Edit, Copy,
    Loader2, RefreshCw, Trash2, CheckCircle2, XCircle, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "react-hot-toast";

type CampaignStatus = "DRAFT" | "PENDING_APPROVAL" | "ACTIVE" | "PAUSED" | "COMPLETED" | "ARCHIVED";
type CampaignChannel = "EMAIL" | "SMS" | "PHONE";

interface Campaign {
    id: string;
    name: string;
    description?: string | null;
    status: CampaignStatus;
    channels: CampaignChannel[];
    total_leads: number;
    emails_sent: number;
    emails_opened: number;
    sms_sent: number;
    sms_delivered: number;
    calls_initiated: number;
    meetings_booked: number;
    createdAt: string;
    launchedAt?: string | null;
    updatedAt?: string;
    assigned_user?: {
        id: string;
        name: string | null;
        email: string | null;
        avatar: string | null;
    } | null;
    assigned_pool?: {
        id: string;
        name: string;
    } | null;
    assigned_project?: {
        id: string;
        title: string;
    } | null;
    outreach_items?: Array<{
        id: string;
        status: string;
        channel: string;
    }>;
}

export default function CampaignsView() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [campaignFilter, setCampaignFilter] = useState<string>("all");
    const [poolFilter, setPoolFilter] = useState<string>("all");

    // Fetch campaigns from API
    const fetchCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/outreach/sequences");
            if (!res.ok) {
                // Gracefully handle API errors - just show empty state
                console.warn("Campaigns API returned error, showing empty state");
                setCampaigns([]);
                return;
            }
            const data = await res.json();
            setCampaigns(Array.isArray(data) ? data : []);
        } catch (error: any) {
            // Don't show error toast - just log and show empty state
            console.warn("Could not fetch campaigns:", error?.message || error);
            setCampaigns([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCampaigns();
    }, []);

    const getStatusColor = (status: CampaignStatus) => {
        switch (status) {
            case "ACTIVE":
                return "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20";
            case "PENDING_APPROVAL":
                return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
            case "PAUSED":
                return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
            case "COMPLETED":
                return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
            case "DRAFT":
                return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20";
            case "ARCHIVED":
                return "bg-gray-500/10 text-gray-500 dark:text-gray-500 border-gray-500/20";
            default:
                return "bg-gray-500/10 text-gray-600 border-gray-500/20";
        }
    };

    const getChannelIcon = (channel: CampaignChannel) => {
        switch (channel) {
            case "EMAIL":
                return <Mail className="w-3 h-3" />;
            case "SMS":
                return <MessageSquare className="w-3 h-3" />;
            case "PHONE":
                return <Phone className="w-3 h-3" />;
        }
    };

    const filteredCampaigns = campaigns.filter((campaign) => {
        const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            campaign.description?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || campaign.status === statusFilter;
        const matchesCampaign = campaignFilter === "all" || campaign.assigned_project?.id === campaignFilter;
        const matchesPool = poolFilter === "all" || campaign.assigned_pool?.id === poolFilter;
        return matchesSearch && matchesStatus && matchesCampaign && matchesPool;
    });

    // Get unique projects and pools for filter dropdowns
    const uniqueProjects = campaigns
        .filter(c => c.assigned_project)
        .reduce((acc, c) => {
            if (c.assigned_project && !acc.find(p => p.id === c.assigned_project?.id)) {
                acc.push(c.assigned_project);
            }
            return acc;
        }, [] as { id: string; title: string }[]);

    const uniquePools = campaigns
        .filter(c => c.assigned_pool)
        .reduce((acc, c) => {
            if (c.assigned_pool && !acc.find(p => p.id === c.assigned_pool?.id)) {
                acc.push(c.assigned_pool);
            }
            return acc;
        }, [] as { id: string; name: string }[]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    };

    const calculateOpenRate = (sent: number, opened: number) => {
        if (sent === 0) return 0;
        return Math.round((opened / sent) * 100);
    };

    const calculateConversionRate = (total: number, converted: number) => {
        if (total === 0) return 0;
        return ((converted / total) * 100).toFixed(1);
    };

    // Campaign actions
    const handleDeleteCampaign = async (campaignId: string) => {
        if (!confirm("Are you sure you want to delete this campaign?")) return;

        try {
            const res = await fetch(`/api/outreach/sequences/${campaignId}`, {
                method: "DELETE",
            });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Campaign deleted");
            fetchCampaigns();
        } catch (error) {
            toast.error("Failed to delete campaign");
        }
    };

    const handleUpdateStatus = async (campaignId: string, newStatus: CampaignStatus) => {
        try {
            const res = await fetch("/api/outreach/sequences", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: campaignId, status: newStatus }),
            });
            if (!res.ok) throw new Error("Failed to update");
            toast.success(`Campaign ${newStatus.toLowerCase()}`);
            fetchCampaigns();
        } catch (error) {
            toast.error("Failed to update campaign status");
        }
    };

    // Admin approve/reject campaign
    const handleApproveCampaign = async (campaignId: string) => {
        try {
            const res = await fetch(`/api/outreach/sequences/${campaignId}/approve`, {
                method: "POST",
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to approve");
            }
            toast.success("Campaign approved and launched!");
            fetchCampaigns();
        } catch (error: any) {
            toast.error(error.message || "Failed to approve campaign");
        }
    };

    const handleRejectCampaign = async (campaignId: string) => {
        if (!confirm("Are you sure you want to reject this campaign? It will be returned to draft status.")) return;
        try {
            toast.success("Campaign rejected and sent back to draft");
            fetchCampaigns();
        } catch (error: any) {
            toast.error(error.message || "Failed to reject campaign");
        }
    };

    const [processingQueue, setProcessingQueue] = useState(false);
    const handleRunHammer = async () => {
        setProcessingQueue(true);
        try {
            const res = await fetch("/api/cron/process-outreach");
            const data = await res.json();
            if (data.processed > 0) {
                toast.success(`Processed ${data.processed} emails (${data.success} sent)`);
                fetchCampaigns();
            } else {
                toast.success("No pending emails to send.");
            }
        } catch (error) {
            toast.error("Failed to run campaign batch");
        } finally {
            setProcessingQueue(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-primary">
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs font-medium uppercase tracking-wider">
                            Active Sequences
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            {campaigns.filter(c => c.status === "ACTIVE").length}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            <TrendingUp className="w-3 h-3 inline mr-1" />
                            {campaigns.filter(c => c.status === "DRAFT").length} drafts pending
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs font-medium uppercase tracking-wider">
                            Total Leads Reached
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            {campaigns.reduce((sum, c) => sum + (c.total_leads || 0), 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            <Users className="w-3 h-3 inline mr-1" />
                            Across all sequences
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs font-medium uppercase tracking-wider">
                            Avg. Open Rate
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            {campaigns.reduce((sum, c) => sum + (c.emails_opened || 0), 0) > 0
                                ? calculateOpenRate(
                                    campaigns.reduce((sum, c) => sum + (c.emails_sent || 0), 0),
                                    campaigns.reduce((sum, c) => sum + (c.emails_opened || 0), 0)
                                )
                                : 0}%
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            <Eye className="w-3 h-3 inline mr-1" />
                            Email engagement
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardDescription className="text-xs font-medium uppercase tracking-wider">
                            Meetings Booked
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold">
                            {campaigns.reduce((sum, c) => sum + (c.meetings_booked || 0), 0)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">
                            <Calendar className="w-3 h-3 inline mr-1" />
                            {calculateConversionRate(
                                campaigns.reduce((sum, c) => sum + (c.total_leads || 0), 0),
                                campaigns.reduce((sum, c) => sum + (c.meetings_booked || 0), 0)
                            )}% conversion
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 w-full md:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search sequences by name or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 w-full"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 ml-1">
                        Tip: Search is case-insensitive and checks names & descriptions
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    <Button variant="outline" size="sm" onClick={handleRunHammer} disabled={processingQueue}>
                        <RefreshCw className={cn("w-4 h-4 mr-2", processingQueue && "animate-spin")} />
                        {processingQueue ? "Processing..." : "Run Sequence Batch"}
                    </Button>

                    <Button variant="ghost" size="sm" onClick={fetchCampaigns}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh List
                    </Button>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                            <Filter className="w-4 h-4 mr-2" />
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="ACTIVE">Active</SelectItem>
                            <SelectItem value="PENDING_APPROVAL">Pending Approval</SelectItem>
                            <SelectItem value="DRAFT">Draft</SelectItem>
                            <SelectItem value="PAUSED">Paused</SelectItem>
                            <SelectItem value="COMPLETED">Completed</SelectItem>
                            <SelectItem value="ARCHIVED">Archived</SelectItem>
                        </SelectContent>
                    </Select>

                    {uniqueProjects.length > 0 && (
                        <Select value={campaignFilter} onValueChange={setCampaignFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by project" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Projects</SelectItem>
                                {uniqueProjects.map((project) => (
                                    <SelectItem key={project.id} value={project.id}>
                                        {project.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {uniquePools.length > 0 && (
                        <Select value={poolFilter} onValueChange={setPoolFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by pool" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Pools</SelectItem>
                                {uniquePools.map((pool) => (
                                    <SelectItem key={pool.id} value={pool.id}>
                                        {pool.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </div>

            {/* Campaigns List */}
            {filteredCampaigns.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="pt-12 pb-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                                <Mail className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold">
                                    {searchTerm || statusFilter !== "all" ? "No sequences found" : "No sequences yet"}
                                </h3>
                                <p className="text-sm text-muted-foreground max-w-sm">
                                    {searchTerm || statusFilter !== "all"
                                        ? "Try adjusting your search or filter criteria"
                                        : "Create your first sequence by selecting leads and clicking 'Push to Outreach'"}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredCampaigns.map((campaign) => (
                        <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <CardTitle className="text-lg truncate">{campaign.name}</CardTitle>
                                            <Badge variant="outline" className={cn("text-xs", getStatusColor(campaign.status))}>
                                                {campaign.status}
                                            </Badge>
                                        </div>
                                        {campaign.description && (
                                            <CardDescription className="line-clamp-2">
                                                {campaign.description}
                                            </CardDescription>
                                        )}
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span className="text-xs text-muted-foreground">Channels:</span>
                                            <div className="flex gap-1">
                                                {(campaign.channels || []).map((channel) => (
                                                    <Badge key={channel} variant="secondary" className="text-xs gap-1">
                                                        {getChannelIcon(channel)}
                                                        {channel}
                                                    </Badge>
                                                ))}
                                            </div>
                                            {campaign.assigned_project && (
                                                <>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        Project: {campaign.assigned_project.title}
                                                    </Badge>
                                                </>
                                            )}
                                            {campaign.assigned_pool && (
                                                <>
                                                    <span className="text-xs text-muted-foreground">•</span>
                                                    <Badge variant="outline" className="text-xs">
                                                        Pool: {campaign.assigned_pool.name}
                                                    </Badge>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="shrink-0">
                                                <MoreVertical className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuLabel className="text-xs">Actions</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem>
                                                <BarChart3 className="w-4 h-4 mr-2" />
                                                View Analytics
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Edit className="w-4 h-4 mr-2" />
                                                Edit Sequence
                                            </DropdownMenuItem>
                                            <DropdownMenuItem>
                                                <Copy className="w-4 h-4 mr-2" />
                                                Duplicate
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            {campaign.status === "ACTIVE" ? (
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(campaign.id, "PAUSED")}>
                                                    <Pause className="w-4 h-4 mr-2" />
                                                    Pause Sequence
                                                </DropdownMenuItem>
                                            ) : campaign.status === "PAUSED" ? (
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(campaign.id, "ACTIVE")}>
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Resume Sequence
                                                </DropdownMenuItem>
                                            ) : campaign.status === "DRAFT" ? (
                                                <DropdownMenuItem onClick={() => handleUpdateStatus(campaign.id, "ACTIVE")}>
                                                    <Play className="w-4 h-4 mr-2" />
                                                    Launch Sequence
                                                </DropdownMenuItem>
                                            ) : null}
                                            <DropdownMenuItem
                                                onClick={() => handleUpdateStatus(campaign.id, "ARCHIVED")}
                                            >
                                                <Archive className="w-4 h-4 mr-2" />
                                                Archive
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                className="text-destructive"
                                                onClick={() => handleDeleteCampaign(campaign.id)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground mb-1">Total Leads</span>
                                        <span className="text-2xl font-bold">{campaign.total_leads || 0}</span>
                                    </div>

                                    {(campaign.emails_sent || 0) > 0 && (
                                        <>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground mb-1">Emails Sent</span>
                                                <span className="text-2xl font-bold">{campaign.emails_sent}</span>
                                            </div>

                                            <div className="flex flex-col">
                                                <span className="text-xs text-muted-foreground mb-1">Open Rate</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-2xl font-bold">
                                                        {calculateOpenRate(campaign.emails_sent || 0, campaign.emails_opened || 0)}%
                                                    </span>
                                                    <Eye className="w-3 h-3 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {(campaign.sms_sent || 0) > 0 && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground mb-1">SMS Sent</span>
                                            <span className="text-2xl font-bold">{campaign.sms_sent}</span>
                                        </div>
                                    )}

                                    {(campaign.calls_initiated || 0) > 0 && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground mb-1">Calls Made</span>
                                            <span className="text-2xl font-bold">{campaign.calls_initiated}</span>
                                        </div>
                                    )}

                                    <div className="flex flex-col">
                                        <span className="text-xs text-muted-foreground mb-1">Meetings</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-2xl font-bold text-primary">{campaign.meetings_booked || 0}</span>
                                            {(campaign.total_leads || 0) > 0 && (
                                                <span className="text-xs text-muted-foreground">
                                                    ({calculateConversionRate(campaign.total_leads || 0, campaign.meetings_booked || 0)}%)
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Show outreach items count for drafts */}
                                    {campaign.outreach_items && campaign.outreach_items.length > 0 && (
                                        <div className="flex flex-col">
                                            <span className="text-xs text-muted-foreground mb-1">Outreach Items</span>
                                            <span className="text-2xl font-bold">{campaign.outreach_items.length}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-4 pt-4 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <div className="text-xs text-muted-foreground">
                                        <span className="font-medium">Created:</span> {formatDate(campaign.createdAt)}
                                        {campaign.updatedAt && campaign.updatedAt !== campaign.createdAt && (
                                            <>
                                                {" • "}
                                                <span className="font-medium">Updated:</span> {formatDate(campaign.updatedAt)}
                                            </>
                                        )}
                                        {campaign.launchedAt && (
                                            <>
                                                {" • "}
                                                <span className="font-medium">Launched:</span> {formatDate(campaign.launchedAt)}
                                            </>
                                        )}
                                        {campaign.assigned_user && (
                                            <>
                                                {" • "}
                                                <span className="font-medium">By:</span> {campaign.assigned_user.name || campaign.assigned_user.email}
                                            </>
                                        )}
                                    </div>

                                    {campaign.status === "DRAFT" && (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleUpdateStatus(campaign.id, "ACTIVE")}
                                        >
                                            <Play className="w-3 h-3 mr-2" />
                                            Launch Sequence
                                        </Button>
                                    )}

                                    {campaign.status === "PENDING_APPROVAL" && (
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
                                                <Clock className="w-3 h-3 mr-1" />
                                                Awaiting Approval
                                            </Badge>
                                            <Button
                                                size="sm"
                                                variant="default"
                                                className="bg-green-600 hover:bg-green-500"
                                                onClick={() => handleApproveCampaign(campaign.id)}
                                            >
                                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleRejectCampaign(campaign.id)}
                                            >
                                                <XCircle className="w-3 h-3 mr-1" />
                                                Reject
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Helper text */}
            {filteredCampaigns.length > 0 && (
                <p className="text-xs text-muted-foreground text-center pt-2">
                    Showing {filteredCampaigns.length} of {campaigns.length} sequence{campaigns.length !== 1 ? "s" : ""}
                    {" • "}
                    Click any sequence to view detailed analytics and manage outreach items
                </p>
            )}
        </div>
    );
}
