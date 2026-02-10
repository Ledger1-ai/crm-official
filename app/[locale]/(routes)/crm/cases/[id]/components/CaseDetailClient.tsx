"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    Send,
    Clock,
    User,
    Building2,
    AlertTriangle,
    CheckCircle2,
    ArrowUpCircle,
    MessageSquare,
    History,
    Shield,
    Tag,
    Paperclip,
    MoreHorizontal,
    Eye,
    EyeOff,
    ChevronDown,
    Headset,
    Timer,
    Zap,
    BookOpen,
    Link2,
    ThumbsUp,
    ThumbsDown,
    Route,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface CaseDetailClientProps {
    caseData: any;
    currentUserId: string;
    teamMembers: any[];
}

const STATUS_OPTIONS = [
    { value: "NEW", label: "New" },
    { value: "OPEN", label: "Open" },
    { value: "IN_PROGRESS", label: "In Progress" },
    { value: "WAITING_ON_CUSTOMER", label: "Waiting on Customer" },
    { value: "WAITING_ON_THIRD_PARTY", label: "Waiting on 3rd Party" },
    { value: "ESCALATED", label: "Escalated" },
    { value: "RESOLVED", label: "Resolved" },
    { value: "CLOSED", label: "Closed" },
];

const STATUS_COLORS: Record<string, string> = {
    NEW: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    OPEN: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    IN_PROGRESS: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    WAITING_ON_CUSTOMER: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    WAITING_ON_THIRD_PARTY: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    ESCALATED: "bg-red-500/20 text-red-400 border-red-500/30",
    RESOLVED: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    CLOSED: "bg-gray-500/20 text-gray-400 border-gray-500/30",
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: "bg-slate-500/20 text-slate-400 border-slate-500/30",
    MEDIUM: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    CRITICAL: "bg-red-500/20 text-red-300 border-red-500/40",
};

export default function CaseDetailClient({
    caseData,
    currentUserId,
    teamMembers,
}: CaseDetailClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const commentRef = useRef<HTMLTextAreaElement>(null);

    const [activeCase, setActiveCase] = useState(caseData);
    const [commentBody, setCommentBody] = useState("");
    const [isPublicComment, setIsPublicComment] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);

    // Help Hub state
    const [kbSuggestions, setKbSuggestions] = useState<any[]>([]);
    const [kbLoading, setKbLoading] = useState(false);
    const [kbLinking, setKbLinking] = useState<string | null>(null);

    // Service Commitment countdown
    const [slaCountdown, setSlaCountdown] = useState("");

    useEffect(() => {
        if (!activeCase.resolution_due) return;
        const interval = setInterval(() => {
            const now = Date.now();
            const due = new Date(activeCase.resolution_due).getTime();
            const diff = due - now;
            if (diff <= 0) {
                setSlaCountdown("OVERDUE");
                return;
            }
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setSlaCountdown(`${hours}h ${minutes}m`);
        }, 1000);
        return () => clearInterval(interval);
    }, [activeCase.resolution_due]);

    // Fetch KB suggestions when case loads
    useEffect(() => {
        const fetchSuggestions = async () => {
            setKbLoading(true);
            try {
                const res = await fetch(`/api/crm/knowledge/link?case_id=${activeCase.id}`);
                if (res.ok) {
                    const data = await res.json();
                    setKbSuggestions(data);
                }
            } catch (e) {
                console.error("Failed to fetch KB suggestions", e);
            } finally {
                setKbLoading(false);
            }
        };
        fetchSuggestions();
    }, [activeCase.id]);

    // Link KB article to case
    const linkArticle = async (articleId: string) => {
        setKbLinking(articleId);
        try {
            const res = await fetch("/api/crm/knowledge/link", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ article_id: articleId, case_id: activeCase.id, link_type: "MANUAL" }),
            });
            if (res.ok) {
                setKbSuggestions((prev) => prev.map((s) => s.id === articleId ? { ...s, already_linked: true } : s));
                toast({ title: "Article linked to case" });
            }
        } catch {
            toast({ title: "Error", description: "Failed to link article", variant: "destructive" });
        } finally {
            setKbLinking(null);
        }
    };

    // Auto-route case
    const handleAutoRoute = async () => {
        setIsUpdating(true);
        try {
            const res = await fetch("/api/crm/routing/route-case", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ case_id: activeCase.id }),
            });
            const result = await res.json();
            if (result.routed) {
                setActiveCase((prev: any) => ({ ...prev, assigned_to: result.agentId }));
                toast({ title: "Case Routed", description: `Assigned to ${result.agentName} via ${result.strategy}` });
            } else {
                toast({ title: "No Available Agents", description: result.message, variant: "destructive" });
            }
        } catch {
            toast({ title: "Error", description: "Routing failed", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    // Update case field
    const updateCase = async (field: string, value: any) => {
        setIsUpdating(true);
        try {
            const res = await fetch("/api/crm/cases", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: activeCase.id, [field]: value }),
            });
            if (!res.ok) throw new Error("Failed to update");
            const updated = await res.json();
            setActiveCase((prev: any) => ({ ...prev, ...updated }));
            toast({ title: "Updated", description: `Case ${field} updated` });
        } catch {
            toast({ title: "Error", description: "Failed to update case", variant: "destructive" });
        } finally {
            setIsUpdating(false);
        }
    };

    // Post comment
    const handlePostComment = async () => {
        if (!commentBody.trim()) return;
        setIsSending(true);
        try {
            const res = await fetch(`/api/crm/cases/${activeCase.id}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body: commentBody, is_public: isPublicComment }),
            });
            if (!res.ok) throw new Error("Failed to post comment");
            const newComment = await res.json();
            setActiveCase((prev: any) => ({
                ...prev,
                comments: [newComment, ...(prev.comments || [])],
            }));
            setCommentBody("");
            toast({ title: "Comment posted" });
        } catch {
            toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
        } finally {
            setIsSending(false);
        }
    };

    const formatDate = (date: string) => {
        if (!date) return "—";
        return new Date(date).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        });
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
        <div className="flex flex-col h-[calc(100vh-64px)] bg-background overflow-hidden">
            {/* Top Bar */}
            <div className="shrink-0 flex items-center gap-3 px-4 md:px-6 py-3 border-b border-border/50 bg-background/95 backdrop-blur">
                <Button variant="ghost" size="sm" onClick={() => router.push("/crm/cases")} className="shrink-0">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <div className="h-5 w-px bg-border/50" />
                <span className="text-xs font-mono text-muted-foreground">{activeCase.case_number}</span>
                <Badge className={cn("text-[10px] border", STATUS_COLORS[activeCase.status])}>
                    {STATUS_OPTIONS.find((s) => s.value === activeCase.status)?.label || activeCase.status}
                </Badge>
                <Badge className={cn("text-[10px] border", PRIORITY_COLORS[activeCase.priority])}>
                    {activeCase.priority}
                </Badge>
                {activeCase.sla_breached && (
                    <Badge className="text-[10px] bg-red-500/20 text-red-400 border-red-500/30 border animate-pulse">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Commitment Breached
                    </Badge>
                )}
                <div className="flex-1" />
                {slaCountdown && (
                    <div className={cn(
                        "flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-lg border",
                        slaCountdown === "OVERDUE"
                            ? "bg-red-500/10 text-red-400 border-red-500/30"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    )}>
                        <Timer className="w-3.5 h-3.5" />
                        <span>Commitment: {slaCountdown}</span>
                    </div>
                )}
            </div>

            {/* Main Content: 2-column layout */}
            <div className="flex-1 flex min-h-0 overflow-hidden">
                {/* Left Panel: Feed / Activity */}
                <div className="flex-1 flex flex-col min-w-0 border-r border-border/30">
                    {/* Subject */}
                    <div className="px-5 py-4 border-b border-border/30">
                        <h1 className="text-lg font-semibold leading-tight">{activeCase.subject}</h1>
                        {activeCase.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{activeCase.description}</p>
                        )}
                    </div>

                    {/* Tabs: Comments / Activity */}
                    <Tabs defaultValue="comments" className="flex-1 flex flex-col min-h-0">
                        <TabsList className="w-full justify-start rounded-none border-b border-border/30 bg-transparent h-auto p-0 px-5">
                            <TabsTrigger
                                value="comments"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-transparent py-2.5 px-4 text-xs font-medium"
                            >
                                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                                Comments ({activeCase.comments?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger
                                value="activity"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-transparent py-2.5 px-4 text-xs font-medium"
                            >
                                <History className="w-3.5 h-3.5 mr-1.5" />
                                Activity Log
                            </TabsTrigger>
                            <TabsTrigger
                                value="sla"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-transparent py-2.5 px-4 text-xs font-medium"
                            >
                                <Shield className="w-3.5 h-3.5 mr-1.5" />
                                Service Commitment
                            </TabsTrigger>
                            <TabsTrigger
                                value="knowledge"
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-500 data-[state=active]:text-violet-400 data-[state=active]:bg-transparent py-2.5 px-4 text-xs font-medium"
                            >
                                <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                                Help Hub
                            </TabsTrigger>
                        </TabsList>

                        {/* Comments Tab */}
                        <TabsContent value="comments" className="flex-1 flex flex-col m-0 min-h-0">
                            {/* Comment composer */}
                            <div className="px-5 py-3 border-b border-border/20 bg-muted/5">
                                <div className="flex items-start gap-3">
                                    <div className="w-7 h-7 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400 shrink-0 mt-0.5">
                                        You
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <Textarea
                                            ref={commentRef}
                                            placeholder={isPublicComment ? "Write a reply to the customer..." : "Write an internal note (not visible to customer)..."}
                                            value={commentBody}
                                            onChange={(e) => setCommentBody(e.target.value)}
                                            rows={3}
                                            className={cn(
                                                "resize-none bg-background/50 border-border/50 text-sm",
                                                !isPublicComment && "border-amber-500/30 bg-amber-500/5"
                                            )}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                                                    handlePostComment();
                                                }
                                            }}
                                        />
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setIsPublicComment(!isPublicComment)}
                                                    className={cn(
                                                        "text-xs h-7 px-2",
                                                        isPublicComment ? "text-emerald-400" : "text-amber-400"
                                                    )}
                                                >
                                                    {isPublicComment ? (
                                                        <><Eye className="w-3.5 h-3.5 mr-1" /> Public Reply</>
                                                    ) : (
                                                        <><EyeOff className="w-3.5 h-3.5 mr-1" /> Internal Note</>
                                                    )}
                                                </Button>
                                            </div>
                                            <Button
                                                size="sm"
                                                disabled={!commentBody.trim() || isSending}
                                                onClick={handlePostComment}
                                                className="bg-gradient-to-r from-violet-600 to-purple-600 text-white text-xs h-7"
                                            >
                                                <Send className="w-3.5 h-3.5 mr-1" />
                                                {isSending ? "Sending..." : "Send"}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Comment feed */}
                            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
                                {activeCase.comments?.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground text-sm">
                                        No comments yet. Start the conversation above.
                                    </div>
                                )}
                                {activeCase.comments?.map((comment: any) => (
                                    <div
                                        key={comment.id}
                                        className={cn(
                                            "flex gap-3 group",
                                            comment.is_system && "opacity-60"
                                        )}
                                    >
                                        <div className={cn(
                                            "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                                            comment.is_public
                                                ? "bg-violet-500/20 text-violet-400"
                                                : "bg-amber-500/20 text-amber-400"
                                        )}>
                                            {comment.author?.name?.charAt(0) || "?"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium">{comment.author?.name || "Unknown"}</span>
                                                <span className="text-[10px] text-muted-foreground">{getTimeSince(comment.createdAt)}</span>
                                                {!comment.is_public && (
                                                    <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/20 border">
                                                        <EyeOff className="w-2.5 h-2.5 mr-0.5" /> Internal
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className={cn(
                                                "text-sm leading-relaxed p-3 rounded-lg",
                                                comment.is_public
                                                    ? "bg-muted/30 border border-border/30"
                                                    : "bg-amber-500/5 border border-amber-500/15"
                                            )}>
                                                {comment.body}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Activity Log Tab */}
                        <TabsContent value="activity" className="flex-1 overflow-y-auto m-0 px-5 py-3">
                            <div className="space-y-3">
                                {activeCase.status_transitions?.length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground text-sm">
                                        No status changes yet.
                                    </div>
                                )}
                                {activeCase.status_transitions?.map((transition: any) => (
                                    <div key={transition.id} className="flex items-start gap-3">
                                        <div className="w-7 h-7 rounded-full bg-muted/50 flex items-center justify-center text-xs shrink-0">
                                            <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm">
                                                <span className="font-medium">{transition.changed_by_user?.name || "System"}</span>
                                                {" changed status from "}
                                                <Badge className={cn("text-[10px] border mx-1", STATUS_COLORS[transition.from_status])}>
                                                    {transition.from_status}
                                                </Badge>
                                                {" → "}
                                                <Badge className={cn("text-[10px] border mx-1", STATUS_COLORS[transition.to_status])}>
                                                    {transition.to_status}
                                                </Badge>
                                            </p>
                                            {transition.reason && (
                                                <p className="text-xs text-muted-foreground mt-1">{transition.reason}</p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground mt-0.5">
                                                {formatDate(transition.createdAt)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>

                        {/* Service Commitment Tab */}
                        <TabsContent value="sla" className="flex-1 overflow-y-auto m-0 px-5 py-3">
                            <div className="space-y-4">
                                {activeCase.sla_policy ? (
                                    <>
                                        <div className="p-4 rounded-xl border border-border/50 bg-gradient-to-br from-violet-500/5 to-purple-500/5">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Shield className="w-4 h-4 text-violet-400" />
                                                <span className="text-sm font-semibold">{activeCase.sla_policy.name}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="text-xs text-muted-foreground block mb-1">First Response Due</span>
                                                    <span className={cn(
                                                        "font-mono text-xs",
                                                        activeCase.first_response_at ? "text-emerald-400" :
                                                            activeCase.first_response_due && new Date(activeCase.first_response_due) < new Date()
                                                                ? "text-red-400" : "text-foreground"
                                                    )}>
                                                        {activeCase.first_response_at
                                                            ? `✓ Responded ${formatDate(activeCase.first_response_at)}`
                                                            : activeCase.first_response_due
                                                                ? formatDate(activeCase.first_response_due)
                                                                : "—"
                                                        }
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-muted-foreground block mb-1">Resolution Due</span>
                                                    <span className={cn(
                                                        "font-mono text-xs",
                                                        activeCase.resolvedAt ? "text-emerald-400" :
                                                            activeCase.resolution_due && new Date(activeCase.resolution_due) < new Date()
                                                                ? "text-red-400" : "text-foreground"
                                                    )}>
                                                        {activeCase.resolvedAt
                                                            ? `✓ Resolved ${formatDate(activeCase.resolvedAt)}`
                                                            : activeCase.resolution_due
                                                                ? formatDate(activeCase.resolution_due)
                                                                : "—"
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Milestones */}
                                        {activeCase.milestone_instances?.length > 0 && (
                                            <div>
                                                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Milestones</h3>
                                                <div className="space-y-2">
                                                    {activeCase.milestone_instances.map((instance: any) => (
                                                        <div
                                                            key={instance.id}
                                                            className={cn(
                                                                "flex items-center gap-3 p-3 rounded-lg border text-sm",
                                                                instance.is_completed
                                                                    ? "border-emerald-500/20 bg-emerald-500/5"
                                                                    : instance.is_violated
                                                                        ? "border-red-500/20 bg-red-500/5"
                                                                        : "border-border/30 bg-card/30"
                                                            )}
                                                        >
                                                            {instance.is_completed ? (
                                                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                                                            ) : instance.is_violated ? (
                                                                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                                                            ) : (
                                                                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                                                            )}
                                                            <div className="flex-1">
                                                                <span className="font-medium text-xs">{instance.milestone?.name}</span>
                                                                <span className="text-[10px] text-muted-foreground ml-2">
                                                                    Due: {formatDate(instance.target_date)}
                                                                </span>
                                                            </div>
                                                            {instance.is_completed && (
                                                                <span className="text-[10px] text-emerald-400">
                                                                    ✓ {formatDate(instance.completed_date)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-10 text-muted-foreground text-sm">
                                        No service commitment policy assigned to this case.
                                    </div>
                                )}
                            </div>
                        </TabsContent>

                        {/* Help Hub Tab */}
                        <TabsContent value="knowledge" className="flex-1 overflow-y-auto m-0 px-5 py-3">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Suggested Articles</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-xs h-6"
                                        onClick={() => {
                                            setKbLoading(true);
                                            fetch(`/api/crm/knowledge/link?case_id=${activeCase.id}`)
                                                .then(r => r.json())
                                                .then(setKbSuggestions)
                                                .finally(() => setKbLoading(false));
                                        }}
                                    >
                                        Refresh
                                    </Button>
                                </div>

                                {kbLoading ? (
                                    <div className="text-center py-10 text-muted-foreground text-sm">Loading suggestions...</div>
                                ) : kbSuggestions.length === 0 ? (
                                    <div className="text-center py-10 text-muted-foreground">
                                        <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">No matching articles found</p>
                                        <p className="text-xs mt-1">Create KB articles with relevant keywords to see suggestions here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {kbSuggestions.map((article: any) => (
                                            <div
                                                key={article.id}
                                                className={cn(
                                                    "p-3 rounded-lg border transition-all",
                                                    article.already_linked
                                                        ? "border-emerald-500/20 bg-emerald-500/5"
                                                        : "border-border/30 bg-card/30 hover:border-violet-500/30"
                                                )}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <BookOpen className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="text-sm font-medium">{article.title}</h4>
                                                        {article.summary && (
                                                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{article.summary}</p>
                                                        )}
                                                        <div className="flex items-center gap-3 mt-2">
                                                            {article.category && (
                                                                <span className="text-[10px] text-muted-foreground">{article.category.name}</span>
                                                            )}
                                                            <span className="text-[10px] text-muted-foreground">
                                                                <ThumbsUp className="w-2.5 h-2.5 inline mr-0.5" />{article.helpful_count}
                                                            </span>
                                                            <span className="text-[10px] text-muted-foreground">
                                                                {article.view_count} views
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {article.already_linked ? (
                                                        <Badge className="text-[9px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 border shrink-0">
                                                            <Link2 className="w-2.5 h-2.5 mr-0.5" /> Linked
                                                        </Badge>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-xs h-6 px-2 shrink-0"
                                                            disabled={kbLinking === article.id}
                                                            onClick={() => linkArticle(article.id)}
                                                        >
                                                            <Link2 className="w-3 h-3 mr-1" />
                                                            {kbLinking === article.id ? "..." : "Link"}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Right Sidebar: Case Details */}
                <div className="hidden lg:flex w-[320px] flex-col border-l border-border/30 bg-muted/5 overflow-y-auto">
                    <div className="p-4 space-y-5">
                        {/* Quick Actions */}
                        <div>
                            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Quick Actions</h3>
                            <div className="grid grid-cols-2 gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 justify-start"
                                    onClick={() => updateCase("status", "ESCALATED")}
                                    disabled={isUpdating}
                                >
                                    <ArrowUpCircle className="w-3.5 h-3.5 mr-1.5 text-red-400" /> Escalate
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 justify-start"
                                    onClick={() => updateCase("status", "RESOLVED")}
                                    disabled={isUpdating}
                                >
                                    <CheckCircle2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" /> Resolve
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-xs h-8 justify-start col-span-2"
                                    onClick={handleAutoRoute}
                                    disabled={isUpdating}
                                >
                                    <Route className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Auto Route
                                </Button>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Status</h3>
                            <Select
                                value={activeCase.status}
                                onValueChange={(v) => updateCase("status", v)}
                            >
                                <SelectTrigger className="h-8 text-xs bg-background/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {STATUS_OPTIONS.map((s) => (
                                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div>
                            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Priority</h3>
                            <Select
                                value={activeCase.priority}
                                onValueChange={(v) => updateCase("priority", v)}
                            >
                                <SelectTrigger className="h-8 text-xs bg-background/50">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Assigned To */}
                        <div>
                            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Assigned To</h3>
                            <Select
                                value={activeCase.assigned_to || ""}
                                onValueChange={(v) => updateCase("assigned_to", v)}
                            >
                                <SelectTrigger className="h-8 text-xs bg-background/50">
                                    <SelectValue placeholder="Unassigned" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teamMembers.map((m) => (
                                        <SelectItem key={m.id} value={m.id}>{m.name || m.email}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="h-px bg-border/30" />

                        {/* Contact */}
                        <div>
                            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Contact</h3>
                            {activeCase.contact ? (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <div className="min-w-0">
                                        <p className="text-xs font-medium truncate">
                                            {activeCase.contact.first_name} {activeCase.contact.last_name}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground truncate">{activeCase.contact.email}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">No contact linked</p>
                            )}
                        </div>

                        {/* Account */}
                        <div>
                            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Account</h3>
                            {activeCase.account ? (
                                <div className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30">
                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                    <p className="text-xs font-medium truncate">{activeCase.account.name}</p>
                                </div>
                            ) : (
                                <p className="text-xs text-muted-foreground">No account linked</p>
                            )}
                        </div>

                        <div className="h-px bg-border/30" />

                        {/* Details */}
                        <div>
                            <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Details</h3>
                            <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Origin</span>
                                    <span className="font-medium">{activeCase.origin}</span>
                                </div>
                                {activeCase.type && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Type</span>
                                        <span className="font-medium">{activeCase.type.replace(/_/g, " ")}</span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created</span>
                                    <span className="font-mono text-[11px]">{formatDate(activeCase.createdAt)}</span>
                                </div>
                                {activeCase.creator && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Created By</span>
                                        <span className="font-medium">{activeCase.creator.name}</span>
                                    </div>
                                )}
                                {activeCase.closedAt && (
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Closed</span>
                                        <span className="font-mono text-[11px]">{formatDate(activeCase.closedAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        {activeCase.tags?.length > 0 && (
                            <div>
                                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Tags</h3>
                                <div className="flex flex-wrap gap-1">
                                    {activeCase.tags.map((tag: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-[10px]">
                                            <Tag className="w-2.5 h-2.5 mr-1" />{tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Related Cases */}
                        {(activeCase.parent_case || activeCase.child_cases?.length > 0) && (
                            <div>
                                <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Related Cases</h3>
                                <div className="space-y-1.5">
                                    {activeCase.parent_case && (
                                        <div
                                            onClick={() => router.push(`/crm/cases/${activeCase.parent_case.id}`)}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30 cursor-pointer hover:border-primary/30 transition-colors text-xs"
                                        >
                                            <span className="font-mono text-muted-foreground">{activeCase.parent_case.case_number}</span>
                                            <span className="truncate">{activeCase.parent_case.subject}</span>
                                        </div>
                                    )}
                                    {activeCase.child_cases?.map((child: any) => (
                                        <div
                                            key={child.id}
                                            onClick={() => router.push(`/crm/cases/${child.id}`)}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-background/50 border border-border/30 cursor-pointer hover:border-primary/30 transition-colors text-xs"
                                        >
                                            <span className="font-mono text-muted-foreground">{child.case_number}</span>
                                            <Badge className={cn("text-[9px] border", STATUS_COLORS[child.status])}>{child.status}</Badge>
                                            <span className="truncate flex-1">{child.subject}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
