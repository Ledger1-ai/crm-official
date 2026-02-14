"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import axios from "axios";
import { format } from "date-fns";
import {
    Mail,
    MessageSquare,
    Phone,
    Calendar,
    FileText,
    User,
    MousePointerClick,
    Eye,
    Reply,
    MoreVertical,
    CheckCircle2,
    Clock,
    Sparkles,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Loader2,
    Paperclip,
    Download,
    Save
} from "lucide-react";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SmartEmailModal } from "@/components/modals/SmartEmailModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useCompletion } from "@ai-sdk/react";
import { toast } from "react-hot-toast";

interface TimelineActivity {
    id: string;
    type: string;
    metadata: any;
    createdAt: string;
    assigned_user?: {
        name: string;
        avatar: string;
    };
    outreach?: any;
}

export function LeadTimeline({ leadId, leadEmail, leadName, contactId, accountId }: {
    leadId?: string,
    contactId?: string,
    accountId?: string,
    leadEmail: string,
    leadName: string
}) {
    const [activities, setActivities] = useState<TimelineActivity[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [emailOpen, setEmailOpen] = useState(false);

    // Full Message State
    const [selectedMessage, setSelectedMessage] = useState<any>(null);
    const [fullMsgLoading, setFullMsgLoading] = useState(false);

    // Attachment State
    const [savingAttachment, setSavingAttachment] = useState<string | null>(null);

    // AI Summary State
    const [showAiSummary, setShowAiSummary] = useState(false);
    const { complete, completion, isLoading: isSummarizing } = useCompletion({
        api: "/api/ai/summarize-conversation",
    });

    const targetId = leadId || contactId || accountId;

    // fetchActivities removed, useSWR handles data fetching

    const onSync = async () => {
        try {
            setSyncing(true);
            await axios.get("/api/gmail/sync?days=7");
            await axios.get("/api/microsoft/sync?days=7");
            await mutate();
        } catch (error) {
            console.error("Sync failed", error);
        } finally {
            setSyncing(false);
        }
    };

    const handleViewFull = async (activity: TimelineActivity) => {
        const meta = activity.metadata;
        const threadId = meta?.threadId;
        const messageId = meta?.messageId;
        const provider = meta?.provider || "gmail";

        if (!threadId && !messageId) return;

        try {
            setFullMsgLoading(true);
            const res = await axios.get(`/api/email/fetch-full`, {
                params: { threadId, messageId, provider }
            });
            setSelectedMessage({
                ...activity,
                fullContent: res.data.messages || [res.data.message]
            });
        } catch (error) {
            console.error("Failed to fetch full message", error);
        } finally {
            setFullMsgLoading(false);
        }
    };

    const handleSaveAttachment = async (attachment: any, provider: string) => {
        try {
            setSavingAttachment(attachment.id);
            const res = await axios.post("/api/email/attachments/save", {
                attachmentId: attachment.id,
                messageId: attachment.messageId,
                filename: attachment.filename,
                mimeType: attachment.mimeType,
                provider,
                leadId,
                contactId,
                accountId
            });

            if (res.data.ok) {
                toast.success(`Saved ${attachment.filename} to CRM documents`);
            }
        } catch (error: any) {
            console.error("Failed to save attachment", error);
            toast.error(error.response?.data || "Failed to save attachment");
        } finally {
            setSavingAttachment(null);
        }
    };

    const handleGenerateSummary = () => {
        const emailMessages = activities
            .filter(a => a.type === "EMAIL" || a.type === "reply_received")
            .slice(0, 5); // Summarize last 5 interactions

        if (emailMessages.length === 0) return;

        setShowAiSummary(true);
        complete("", {
            body: {
                messages: emailMessages,
                leadName
            }
        });
    };

    const { data, mutate } = useSWR(
        targetId ? `/api/crm/leads/${targetId}/activities` : null,
        (url) => axios.get(url).then((res) => res.data),
        {
            refreshInterval: 30000,
            revalidateOnFocus: false,
        }
    );

    useEffect(() => {
        if (data?.activities) {
            setActivities(data.activities);
            setLoading(false);
        }
    }, [data]);


    const getActivityIcon = (type: string) => {
        switch (type) {
            case "EMAIL": return <Mail className="h-4 w-4 text-emerald-400" />;
            case "reply_received": return <Reply className="h-4 w-4 text-blue-400" />;
            case "note": return <FileText className="h-4 w-4 text-yellow-400" />;
            case "SMS": return <MessageSquare className="h-4 w-4 text-purple-400" />;
            case "CALL": return <Phone className="h-4 w-4 text-orange-400" />;
            default: return <Clock className="h-4 w-4 text-white/40" />;
        }
    };

    const getActivityLabel = (type: string) => {
        switch (type) {
            case "EMAIL": return "Email Sent";
            case "reply_received": return "Reply Received";
            case "note": return "Note Added";
            case "SMS": return "SMS Sent";
            case "CALL": return "Call Logged";
            default: return type;
        }
    };

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 w-full bg-white/5 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/5 before:to-transparent">
            <SmartEmailModal
                open={emailOpen}
                onOpenChange={setEmailOpen}
                recipientEmail={leadEmail}
                recipientName={leadName}
                leadId={leadId || contactId}
            />

            {/* Full Message Dialog */}
            <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0a0a0a] border-white/10 text-white p-0 overflow-hidden">
                    <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/10 p-6 z-20">
                        <DialogTitle className="flex items-center gap-3 text-lg">
                            <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                                <Mail className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold tracking-tight">{selectedMessage?.metadata?.subject || "Email Conversation"}</span>
                                <span className="text-xs text-white/40 font-medium uppercase tracking-widest">{selectedMessage?.metadata?.provider || "Email Provider"} Thread</span>
                            </div>
                        </DialogTitle>
                    </div>

                    <div className="p-6 space-y-8 pb-12">
                        {selectedMessage?.fullContent?.map((msg: any, idx: number) => {
                            const body = msg.body?.content || msg.snippet || "";
                            const attachments = msg.attachments || [];

                            return (
                                <div key={idx} className="relative group/msg">
                                    <div className="flex items-start gap-4 mb-3">
                                        <Avatar className="h-8 w-8 border border-white/10 shadow-lg">
                                            <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                                                {(msg.from?.emailAddress?.name || "U").charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-sm font-bold text-white/90 truncate mr-2">
                                                    {msg.from?.emailAddress?.name || msg.from?.emailAddress?.address || "System"}
                                                </p>
                                                <time className="text-[10px] font-mono font-bold text-white/20 uppercase">
                                                    {msg.receivedDateTime ? format(new Date(msg.receivedDateTime), "MMM d, h:mm a") : ""}
                                                </time>
                                            </div>

                                            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 shadow-inner">
                                                <div className="text-[13px] text-white/80 leading-relaxed prose prose-invert max-w-none prose-sm prose-p:my-2" dangerouslySetInnerHTML={{ __html: body }} />

                                                {/* Attachments Section */}
                                                {attachments.length > 0 && (
                                                    <div className="mt-6 pt-4 border-t border-white/5">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Paperclip size={12} className="text-white/40" />
                                                            <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Attachments ({attachments.length})</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                            {attachments.map((att: any) => (
                                                                <div key={att.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl p-2 px-3 group/att hover:border-primary/30 transition-all">
                                                                    <div className="flex items-center gap-2 min-w-0">
                                                                        <div className="h-7 w-7 rounded bg-white/5 flex items-center justify-center text-white/40">
                                                                            <FileText size={14} />
                                                                        </div>
                                                                        <div className="flex flex-col min-w-0">
                                                                            <span className="text-[11px] font-medium text-white/70 truncate">{att.filename}</span>
                                                                            <span className="text-[9px] text-white/30 uppercase font-bold">{(att.size / 1024).toFixed(0)} KB</span>
                                                                        </div>
                                                                    </div>
                                                                    <Button
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="h-8 w-8 text-white/40 hover:text-primary hover:bg-primary/10 rounded-lg"
                                                                        onClick={() => handleSaveAttachment(att, selectedMessage.metadata.provider || "gmail")}
                                                                        disabled={savingAttachment === att.id}
                                                                    >
                                                                        {savingAttachment === att.id ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                                                    </Button>
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
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="flex justify-between items-center mb-4 relative z-10">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[10px] font-bold text-emerald-400 hover:bg-emerald-400/10"
                    onClick={handleGenerateSummary}
                    disabled={isSummarizing || activities.length === 0}
                >
                    <Sparkles className={cn("mr-2 h-3.5 w-3.5", isSummarizing && "animate-pulse")} />
                    {isSummarizing ? "SUMMARIZING..." : "AI OVERVIEW"}
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[10px] font-bold border-white/10 bg-white/5 hover:bg-white/10 text-white/60"
                    onClick={onSync}
                    disabled={syncing}
                >
                    <Clock className={cn("mr-2 h-3.5 w-3.5", syncing && "animate-spin text-primary")} />
                    {syncing ? "SYNCING..." : "SYNC NOW"}
                </Button>
            </div>

            {/* AI Summary Card */}
            {showAiSummary && (
                <Card className="bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)] relative z-10 overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50" />
                    <CardHeader className="py-3 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-emerald-400" />
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-emerald-400/80">AI Conversation Overview</CardTitle>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowAiSummary(false)}>
                            <ChevronUp className="h-3 w-3" />
                        </Button>
                    </CardHeader>
                    <CardContent className="pb-4 pt-0">
                        <div className="text-sm text-emerald-100/70 leading-relaxed whitespace-pre-wrap font-medium italic">
                            {completion || "Analyzing conversation..."}
                            {isSummarizing && <span className="inline-block w-1.5 h-4 bg-emerald-400 ml-1 animate-pulse" />}
                        </div>
                    </CardContent>
                </Card>
            )}

            {activities.length === 0 ? (
                <Card className="bg-transparent border-white/5 border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-white/20">
                        <Clock className="h-12 w-12 mb-4 opacity-10" />
                        <p className="text-sm italic tracking-tight font-medium">No activity history recorded for this lead yet.</p>
                        <div className="flex gap-4 mt-4">
                            <Button variant="ghost" className="text-xs font-bold text-primary hover:bg-primary/10" onClick={() => setEmailOpen(true)}>
                                SEND FIRST EMAIL
                            </Button>
                            <Button variant="ghost" className="text-xs font-bold text-white/40 hover:bg-white/5" onClick={onSync} disabled={syncing}>
                                {syncing ? "SYNCING..." : "SYNC NOW"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                activities.map((activity, index) => {
                    const isEmail = activity.type === "EMAIL";
                    const isReply = activity.type === "reply_received";
                    const outreach = activity.outreach;

                    return (
                        <div key={activity.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                            {/* Dot */}
                            <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white/10 bg-[#0a0a0a] shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 transition-colors group-hover:border-primary/50">
                                {getActivityIcon(activity.type)}
                            </div>

                            {/* Content */}
                            <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-[#0f0f0f] border border-white/5 p-4 rounded-2xl shadow-xl transition-all hover:bg-white/[0.02] group/card hover:border-white/10">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <time className="font-mono text-[10px] uppercase font-bold text-white/30">
                                            {format(new Date(activity.createdAt), "MMM d, yyyy · h:mm a")}
                                        </time>
                                        <Badge variant="outline" className="text-[9px] h-4 border-white/5 bg-white/5 text-white/50 px-1.5 py-0">
                                            {getActivityLabel(activity.type)}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {activity.assigned_user && (
                                            <div className="flex items-center gap-1.5 bg-white/5 rounded-full pl-1 pr-2 py-0.5 border border-white/5">
                                                <Avatar className="h-4 w-4 border border-white/10">
                                                    <AvatarImage src={activity.assigned_user.avatar} />
                                                    <AvatarFallback className="text-[8px] bg-primary/20 text-primary uppercase">{activity.assigned_user.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-[10px] font-medium text-white/40">{activity.assigned_user.name}</span>
                                            </div>
                                        )}
                                        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg opacity-0 group-hover/card:opacity-100 transition-opacity">
                                            <MoreVertical className="h-3 w-3 text-white/40" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {isEmail && (
                                        <div className="space-y-2">
                                            <h4 className="text-sm font-semibold text-white/90 leading-snug">
                                                {activity.metadata?.subject || "No Subject"}
                                            </h4>
                                            {outreach && (
                                                <div className="flex flex-wrap gap-3 py-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={cn(
                                                            "h-1.5 w-1.5 rounded-full shadow-[0_0_8px]",
                                                            outreach.openedAt ? "bg-emerald-500 shadow-emerald-500/50" : "bg-white/10 shadow-transparent"
                                                        )} />
                                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                                                            <Eye size={10} /> {outreach.openedAt ? "Opened" : "Unread"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <div className={cn(
                                                            "h-1.5 w-1.5 rounded-full shadow-[0_0_8px]",
                                                            outreach.clickedAt ? "bg-orange-500 shadow-orange-500/50" : "bg-white/10 shadow-transparent"
                                                        )} />
                                                        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider flex items-center gap-1">
                                                            <MousePointerClick size={10} /> {outreach.clickedAt ? "Clicked Link" : "No Clicks"}
                                                        </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isReply && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-400 uppercase">
                                                    Inbound Reply
                                                </div>
                                                <span className="text-xs text-white/40">from {activity.metadata?.from_email}</span>
                                            </div>
                                            <p className="text-sm text-white/70 line-clamp-2 leading-relaxed italic border-l-2 border-primary/30 pl-3 py-0.5 bg-primary/[0.02]">
                                                {activity.metadata?.snippet || "New message received from lead..."}
                                            </p>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {(isEmail || isReply) && (
                                        <div className="flex gap-2 pt-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-[10px] font-bold border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all rounded-full"
                                                onClick={() => handleViewFull(activity)}
                                                disabled={fullMsgLoading}
                                            >
                                                {fullMsgLoading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ExternalLink className="h-3 w-3 mr-1" />}
                                                VIEW FULL MESSAGE
                                            </Button>
                                            {isReply && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-[10px] font-bold border-primary/30 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all rounded-full"
                                                    onClick={() => setEmailOpen(true)}
                                                >
                                                    <Reply className="h-3 w-3 mr-1" />
                                                    REPLY
                                                </Button>
                                            )}
                                        </div>
                                    )}

                                    {activity.type === "note" && (
                                        <p className="text-sm text-white/60 leading-relaxed bg-white/[0.02] p-3 rounded-xl border border-white/5 italic">
                                            "{activity.metadata?.text}"
                                        </p>
                                    )}

                                    {(activity.type === "CALL" || activity.type === "SMS") && (
                                        <div className="space-y-1">
                                            <p className="text-sm text-white/80 font-medium">Outreach via {activity.type}</p>
                                            <p className="text-xs text-white/40">Status: {activity.metadata?.status || "Logged"}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}
