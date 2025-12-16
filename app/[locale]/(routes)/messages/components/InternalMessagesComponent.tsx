"use client";

import * as React from "react";
import {
    Archive,
    File,
    FileText,
    Inbox,
    PenBox,
    Search,
    Send,
    Trash2,
    Users2,
    MailPlus,
    Clock,
    Star,
    Reply,
    Forward,
    MoreVertical,
    FormInput,
    UserPlus,
} from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format, formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface TeamMember {
    id: string;
    name: string | null;
    email: string | null;
}

interface Message {
    id: string;
    subject: string | null;
    body: string | null;
    createdAt: Date | string;
    is_read: boolean;
    is_important: boolean;
    labels: string[];
    from_user_id: string;
    to_user_id: string;
    from_user?: TeamMember | null;
    to_user?: TeamMember | null;
}

interface FormSubmission {
    id: string;
    form_id: string;
    data: Record<string, any>;
    source_url?: string;
    ip_address?: string;
    status: string;
    createdAt: Date | string;
    converted_lead_id?: string | null;
    lead_id?: string | null;
    form: {
        id: string;
        name: string;
        slug: string;
        project_id?: string | null;
    };
}

interface InternalMessagesProps {
    messages: Message[];
    teamMembers: TeamMember[];
    formSubmissions?: FormSubmission[];
    currentUserId: string;
    currentUserName: string;
    currentUserEmail: string;
    defaultLayout?: number[];
    defaultCollapsed?: boolean;
}

export function InternalMessagesComponent({
    messages,
    teamMembers,
    formSubmissions = [],
    currentUserId,
    currentUserName,
    currentUserEmail,
    defaultLayout = [20, 35, 45],
    defaultCollapsed = false,
}: InternalMessagesProps) {
    const router = useRouter();
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
    const [selectedMessageId, setSelectedMessageId] = React.useState<string | null>(null);
    const [selectedSubmissionId, setSelectedSubmissionId] = React.useState<string | null>(null);
    const [composeOpen, setComposeOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [activeNav, setActiveNav] = React.useState<"inbox" | "sent" | "drafts" | "archive" | "trash" | "submissions">("inbox");
    const [isConvertingToLead, setIsConvertingToLead] = React.useState(false);

    // Compose form state
    const [composeToUserId, setComposeToUserId] = React.useState("");
    const [composeSubject, setComposeSubject] = React.useState("");
    const [composeBody, setComposeBody] = React.useState("");
    const [isSending, setIsSending] = React.useState(false);

    // Filter messages based on active nav and search
    const filteredMessages = React.useMemo(() => {
        let filtered = messages;

        switch (activeNav) {
            case "inbox":
                filtered = messages.filter(m => m.to_user_id === currentUserId);
                break;
            case "sent":
                filtered = messages.filter(m => m.from_user_id === currentUserId);
                break;
            case "drafts":
                filtered = messages.filter(m => m.labels?.includes("draft"));
                break;
            case "archive":
                filtered = messages.filter(m => m.labels?.includes("archive"));
                break;
            case "trash":
                filtered = messages.filter(m => m.labels?.includes("trash"));
                break;
        }

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                m =>
                    (m.subject || "").toLowerCase().includes(query) ||
                    (m.body || "").toLowerCase().includes(query) ||
                    (m.from_user?.name || "").toLowerCase().includes(query) ||
                    (m.to_user?.name || "").toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [messages, activeNav, searchQuery, currentUserId]);

    const selectedMessage = React.useMemo(() => {
        return filteredMessages.find(m => m.id === selectedMessageId) || null;
    }, [filteredMessages, selectedMessageId]);

    const inboxCount = messages.filter(m => m.to_user_id === currentUserId && !m.is_read).length;
    const submissionsCount = formSubmissions.filter(s => s.status === "NEW").length;

    const selectedSubmission = React.useMemo(() => {
        return formSubmissions.find(s => s.id === selectedSubmissionId) || null;
    }, [formSubmissions, selectedSubmissionId]);

    // Convert submission to lead
    const handleConvertToLead = async (submissionId: string) => {
        setIsConvertingToLead(true);
        try {
            const res = await fetch("/api/forms/submissions/convert-to-lead", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissionId }),
            });

            if (!res.ok) throw new Error("Failed to convert to lead");

            toast.success("Lead created successfully!");
            router.refresh();
        } catch (error) {
            toast.error("Failed to convert to lead");
        } finally {
            setIsConvertingToLead(false);
        }
    };

    const handleSendMessage = async () => {
        if (!composeToUserId || !composeBody.trim()) {
            toast.error("Please select a recipient and enter a message");
            return;
        }

        setIsSending(true);
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    to_user_id: composeToUserId,
                    subject: composeSubject || "(No Subject)",
                    body: composeBody,
                }),
            });

            if (!res.ok) throw new Error("Failed to send message");

            toast.success("Message sent!");
            setComposeOpen(false);
            setComposeToUserId("");
            setComposeSubject("");
            setComposeBody("");
            router.refresh();
        } catch (error) {
            toast.error("Failed to send message");
        } finally {
            setIsSending(false);
        }
    };

    const getInitials = (name: string | null | undefined) => {
        if (!name) return "?";
        return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    };

    const formatMessageDate = (date: Date | string) => {
        const d = new Date(date);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        const daysDiff = diff / (1000 * 60 * 60 * 24);

        if (daysDiff < 1) {
            return formatDistanceToNow(d, { addSuffix: true });
        } else if (daysDiff < 7) {
            return format(d, "EEEE");
        } else {
            return format(d, "MMM d, yyyy");
        }
    };

    const navItems = [
        { id: "inbox" as const, title: "Inbox", icon: Inbox, count: inboxCount },
        { id: "submissions" as const, title: "Form Submissions", icon: FormInput, count: submissionsCount },
        { id: "sent" as const, title: "Sent", icon: Send, count: 0 },
        { id: "drafts" as const, title: "Drafts", icon: File, count: 0 },
        { id: "archive" as const, title: "Archive", icon: Archive, count: 0 },
        { id: "trash" as const, title: "Trash", icon: Trash2, count: 0 },
    ];

    const isDesktop = useMediaQuery("(min-width: 768px)");

    if (!isDesktop) {
        return (
            <div className="flex flex-col h-[calc(100vh-150px)]">
                {selectedMessageId || selectedSubmissionId ? (
                    // Detail View (Mobile)
                    <div className="flex flex-col h-full bg-background">
                        <div className="flex items-center gap-2 p-2 border-b">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedMessageId(null);
                                    setSelectedSubmissionId(null);
                                }}
                            >
                                ← Back
                            </Button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {selectedSubmissionId ? (
                                // Mobile Submission Detail
                                selectedSubmission ? (
                                    <div className="p-4">
                                        <h3 className="font-semibold text-lg">{selectedSubmission.form.name}</h3>
                                        {/* ... (Reuse submission detail Logic or Components) ... */}
                                        {/* Ideally extract Detail View to sub-component, but inline for now to save steps */}
                                        <div className="mt-4 space-y-3">
                                            {Object.entries(selectedSubmission.data || {}).map(([key, value]) => (
                                                <div key={key} className="border rounded p-2">
                                                    <div className="text-xs font-bold uppercase">{key}</div>
                                                    <div>{String(value)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : null
                            ) : selectedMessage ? (
                                // Mobile Message Detail
                                <div className="p-4">
                                    <h3 className="font-semibold text-lg">{selectedMessage.subject}</h3>
                                    <div className="text-sm text-muted-foreground my-2">
                                        From: {selectedMessage.from_user?.name}
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="whitespace-pre-wrap">{selectedMessage.body}</div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    // List View (Mobile)
                    <div className="flex flex-col h-full">
                        <div className="flex items-center justify-between p-2 border-b gap-2">
                            <Select value={activeNav} onValueChange={(val: any) => setActiveNav(val)}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Select Folder" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="inbox">Inbox ({inboxCount})</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="drafts">Drafts</SelectItem>
                                    <SelectItem value="submissions">Submissions</SelectItem>
                                </SelectContent>
                            </Select>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" asChild>
                                    <Link href="/messages/forms">
                                        <FileText className="h-5 w-5" />
                                    </Link>
                                </Button>
                                <Button size="sm" onClick={() => setComposeOpen(true)} className="gap-1">
                                    <PenBox className="h-4 w-4" />
                                    <span className="sr-only sm:not-sr-only">Compose</span>
                                </Button>
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            {/* Mobile Message List Items */}
                            {/* Reuse the mapping logic from desktop but simplified */}
                            {activeNav === "submissions" ? (
                                formSubmissions.map(sub => (
                                    <div key={sub.id} onClick={() => setSelectedSubmissionId(sub.id)} className="p-3 border-b active:bg-muted">
                                        <div className="font-medium">{sub.form.name}</div>
                                        <div className="text-sm text-muted-foreground">{formatMessageDate(sub.createdAt)}</div>
                                    </div>
                                ))
                            ) : (
                                filteredMessages.map(msg => (
                                    <div key={msg.id} onClick={() => setSelectedMessageId(msg.id)} className="p-3 border-b active:bg-muted">
                                        <div className="font-semibold">{msg.from_user?.name}</div>
                                        <div className="text-sm">{msg.subject}</div>
                                        <div className="text-xs text-muted-foreground">{formatMessageDate(msg.createdAt)}</div>
                                    </div>
                                ))
                            )}
                        </ScrollArea>
                    </div>
                )}
                {/* Compose Dialog (Shared) */}
                <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
                    <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                            <DialogTitle>New Message</DialogTitle>
                            <DialogDescription>
                                Send a message to a team member
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="to">To</Label>
                                <Select value={composeToUserId} onValueChange={setComposeToUserId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select team member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {teamMembers
                                            .filter(m => m.id !== currentUserId)
                                            .map((member) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.name || member.email || "Unknown"}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="subject">Subject</Label>
                                <Input
                                    id="subject"
                                    placeholder="Message subject"
                                    value={composeSubject}
                                    onChange={(e) => setComposeSubject(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="body">Message</Label>
                                <Textarea
                                    id="body"
                                    placeholder="Write your message..."
                                    rows={8}
                                    value={composeBody}
                                    onChange={(e) => setComposeBody(e.target.value)}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setComposeOpen(false)}>
                                Cancel
                            </Button>
                            <Button onClick={handleSendMessage} disabled={isSending}>
                                {isSending ? "Sending..." : "Send Message"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        );
    }

    // Desktop Return
    return (
        <TooltipProvider delayDuration={0}>
            <ResizablePanelGroup
                direction="horizontal"
                onLayout={(sizes: number[]) => {
                    document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`;
                }}
                className="h-[calc(100vh-250px)] min-h-[500px] items-stretch rounded-lg border"
            >
                {/* Left Sidebar - Navigation */}
                <ResizablePanel
                    defaultSize={defaultLayout[0]}
                    collapsedSize={4}
                    collapsible={true}
                    minSize={15}
                    maxSize={25}
                    onCollapse={() => {
                        setIsCollapsed(true);
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
                    }}
                    onExpand={() => {
                        setIsCollapsed(false);
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`;
                    }}
                    className={cn(isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out")}
                >
                    <div className="flex flex-col h-full">
                        {/* Account Display */}
                        <div className="p-4 border-b">
                            {isCollapsed ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Avatar className="h-8 w-8 mx-auto">
                                            <AvatarFallback>{getInitials(currentUserName)}</AvatarFallback>
                                        </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">
                                        {currentUserName}
                                    </TooltipContent>
                                </Tooltip>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback>{getInitials(currentUserName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{currentUserName}</p>
                                        <p className="text-xs text-muted-foreground truncate">{currentUserEmail}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Compose Button */}
                        <div className="p-2">
                            {isCollapsed ? (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            size="icon"
                                            className="w-full"
                                            onClick={() => setComposeOpen(true)}
                                        >
                                            <PenBox className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent side="right">Compose</TooltipContent>
                                </Tooltip>
                            ) : (
                                <Button
                                    className="w-full gap-2"
                                    onClick={() => setComposeOpen(true)}
                                >
                                    <PenBox className="h-4 w-4" />
                                    Compose
                                </Button>
                            )}
                        </div>

                        <Separator />

                        {/* Navigation Items */}
                        <nav className="flex-1 p-2 space-y-1">
                            {navItems.map((item) => (
                                <Tooltip key={item.id}>
                                    <TooltipTrigger asChild>
                                        <button
                                            onClick={() => setActiveNav(item.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                                                activeNav === item.id
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-muted"
                                            )}
                                        >
                                            <item.icon className="h-4 w-4 flex-shrink-0" />
                                            {!isCollapsed && (
                                                <>
                                                    <span className="flex-1 text-left">{item.title}</span>
                                                    {item.count > 0 && (
                                                        <Badge variant="secondary" className="ml-auto">
                                                            {item.count}
                                                        </Badge>
                                                    )}
                                                </>
                                            )}
                                        </button>
                                    </TooltipTrigger>
                                    {isCollapsed && (
                                        <TooltipContent side="right">
                                            {item.title} {item.count > 0 && `(${item.count})`}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            ))}
                        </nav>

                        <Separator />

                        {/* Quick Links */}
                        <nav className="p-2 space-y-1">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        href="/messages/forms"
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-muted transition-colors"
                                        )}
                                    >
                                        <FileText className="h-4 w-4 flex-shrink-0" />
                                        {!isCollapsed && <span>Form Builder</span>}
                                    </Link>
                                </TooltipTrigger>
                                {isCollapsed && <TooltipContent side="right">Form Builder</TooltipContent>}
                            </Tooltip>
                        </nav>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Middle - Message List */}
                <ResizablePanel defaultSize={defaultLayout[1]} minSize={25}>
                    <div className="flex flex-col h-full">
                        <div className="flex items-center px-4 py-3 border-b">
                            <h2 className="text-lg font-semibold capitalize">{activeNav}</h2>
                            <div className="ml-auto flex items-center gap-2">
                                <Tabs defaultValue="all" className="w-auto">
                                    <TabsList className="h-8">
                                        <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                                        <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </div>
                        <div className="p-3 border-b">
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search messages..."
                                    className="pl-8 h-9"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>
                        <ScrollArea className="flex-1">
                            {activeNav === "submissions" ? (
                                /* Form Submissions List */
                                formSubmissions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                                        <FormInput className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                        <p className="text-muted-foreground">No form submissions</p>
                                        <p className="text-sm text-muted-foreground/70">
                                            Form submissions will appear here
                                        </p>
                                    </div>
                                ) : (
                                    <div className="divide-y">
                                        {formSubmissions.map((submission) => {
                                            const email = submission.data?.email || submission.data?.Email || "";
                                            const name = submission.data?.name || submission.data?.full_name ||
                                                `${submission.data?.first_name || ""} ${submission.data?.last_name || ""}`.trim() ||
                                                submission.data?.firstName || email.split("@")[0] || "Anonymous";
                                            return (
                                                <button
                                                    key={submission.id}
                                                    onClick={() => {
                                                        setSelectedSubmissionId(submission.id);
                                                        setSelectedMessageId(null);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors",
                                                        selectedSubmissionId === submission.id && "bg-muted",
                                                        submission.status === "NEW" && "bg-green-50 dark:bg-green-950/30"
                                                    )}
                                                >
                                                    <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                                                        <FormInput className="h-4 w-4 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <span className={cn(
                                                                "text-sm truncate",
                                                                submission.status === "NEW" && "font-semibold"
                                                            )}>
                                                                {name}
                                                            </span>
                                                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                                Form
                                                            </Badge>
                                                            {submission.converted_lead_id && (
                                                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                                                    Lead Created
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className={cn(
                                                            "text-sm truncate",
                                                            submission.status === "NEW" ? "font-medium" : "text-muted-foreground"
                                                        )}>
                                                            {submission.form.name}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                            {email || submission.source_url || "No email provided"}
                                                        </p>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground flex-shrink-0">
                                                        {formatMessageDate(submission.createdAt)}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )
                            ) : filteredMessages.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-full py-10 text-center">
                                    <Inbox className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <p className="text-muted-foreground">No messages</p>
                                    <p className="text-sm text-muted-foreground/70">
                                        {activeNav === "inbox"
                                            ? "Your inbox is empty"
                                            : `No messages in ${activeNav}`}
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {filteredMessages.map((message) => {
                                        const isFromMe = message.from_user_id === currentUserId;
                                        const otherUser = isFromMe ? message.to_user : message.from_user;
                                        return (
                                            <button
                                                key={message.id}
                                                onClick={() => {
                                                    setSelectedMessageId(message.id);
                                                    setSelectedSubmissionId(null);
                                                }}
                                                className={cn(
                                                    "w-full flex items-start gap-3 p-4 text-left hover:bg-muted/50 transition-colors",
                                                    selectedMessageId === message.id && "bg-muted",
                                                    !message.is_read && activeNav === "inbox" && "bg-blue-50 dark:bg-blue-950/30"
                                                )}
                                            >
                                                <Avatar className="h-9 w-9 flex-shrink-0">
                                                    <AvatarFallback className="text-xs">
                                                        {getInitials(otherUser?.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn(
                                                            "text-sm truncate",
                                                            !message.is_read && activeNav === "inbox" && "font-semibold"
                                                        )}>
                                                            {isFromMe ? `To: ${otherUser?.name || otherUser?.email || "Unknown"}` : otherUser?.name || otherUser?.email || "Unknown"}
                                                        </span>
                                                        {message.is_important && (
                                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                                        )}
                                                    </div>
                                                    <p className={cn(
                                                        "text-sm truncate",
                                                        !message.is_read && activeNav === "inbox" ? "font-medium" : "text-muted-foreground"
                                                    )}>
                                                        {message.subject || "(No Subject)"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                                                        {(message.body || "").slice(0, 100)}
                                                    </p>
                                                </div>
                                                <span className="text-xs text-muted-foreground flex-shrink-0">
                                                    {formatMessageDate(message.createdAt)}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </ResizablePanel>

                <ResizableHandle withHandle />

                {/* Right - Message/Submission Display */}
                <ResizablePanel defaultSize={defaultLayout[2]}>
                    <div className="flex flex-col h-full">
                        {selectedSubmission ? (
                            /* Form Submission Display */
                            <>
                                <div className="flex items-center gap-2 p-4 border-b">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{selectedSubmission.form.name}</h3>
                                            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                                                Form Submission
                                            </Badge>
                                        </div>
                                    </div>
                                    {!selectedSubmission.converted_lead_id && !selectedSubmission.lead_id && (
                                        selectedSubmission.form?.project_id ? (
                                            <Button
                                                size="sm"
                                                onClick={() => handleConvertToLead(selectedSubmission.id)}
                                                disabled={isConvertingToLead}
                                                className="gap-2"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                {isConvertingToLead ? "Creating..." : "Create Lead"}
                                            </Button>
                                        ) : (
                                            <Badge variant="secondary" className="text-orange-600 bg-orange-100 dark:bg-orange-900/30">
                                                ⚠️ No project assigned to form
                                            </Badge>
                                        )
                                    )}
                                    {(selectedSubmission.converted_lead_id || selectedSubmission.lead_id) && (
                                        <Badge variant="outline" className="text-green-600">
                                            ✓ Lead Created
                                        </Badge>
                                    )}
                                </div>
                                <div className="p-4 border-b bg-muted/30">
                                    <div className="flex items-start gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
                                            <FormInput className="h-5 w-5 text-white" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {selectedSubmission.data?.name || selectedSubmission.data?.full_name ||
                                                        `${selectedSubmission.data?.first_name || ""} ${selectedSubmission.data?.last_name || ""}`.trim() ||
                                                        selectedSubmission.data?.email?.split("@")[0] || "Anonymous Visitor"}
                                                </span>
                                            </div>
                                            {selectedSubmission.data?.email && (
                                                <div className="text-sm text-muted-foreground">
                                                    {selectedSubmission.data.email}
                                                </div>
                                            )}
                                            <div className="text-xs text-muted-foreground mt-1">
                                                Submitted {format(new Date(selectedSubmission.createdAt), "PPpp")}
                                                {selectedSubmission.source_url && (
                                                    <span className="ml-2">• from {new URL(selectedSubmission.source_url).hostname}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ScrollArea className="flex-1 p-4">
                                    <div className="space-y-4">
                                        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                                            Submitted Data
                                        </h4>
                                        <div className="space-y-3">
                                            {Object.entries(selectedSubmission.data || {}).map(([key, value]) => (
                                                <div key={key} className="border rounded-lg p-3">
                                                    <div className="text-xs font-medium text-muted-foreground uppercase mb-1">
                                                        {key.replace(/_/g, " ")}
                                                    </div>
                                                    <div className="text-sm whitespace-pre-wrap">
                                                        {typeof value === "boolean" ? (value ? "Yes" : "No") : String(value || "-")}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        {selectedSubmission.source_url && (
                                            <div className="mt-6 pt-4 border-t">
                                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                                                    Submission Info
                                                </h4>
                                                <div className="text-sm space-y-1">
                                                    <div><span className="text-muted-foreground">Source:</span> {selectedSubmission.source_url}</div>
                                                    {selectedSubmission.ip_address && (
                                                        <div><span className="text-muted-foreground">IP:</span> {selectedSubmission.ip_address}</div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </>
                        ) : selectedMessage ? (
                            <>
                                <div className="flex items-center gap-2 p-4 border-b">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{selectedMessage.subject || "(No Subject)"}</h3>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Reply className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Reply</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Forward className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Forward</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Archive className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Archive</TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent>Delete</TooltipContent>
                                        </Tooltip>
                                    </div>
                                </div>
                                <div className="p-4 border-b">
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback>
                                                {getInitials(selectedMessage.from_user?.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">
                                                    {selectedMessage.from_user?.name || selectedMessage.from_user?.email || "Unknown"}
                                                </span>
                                                {selectedMessage.from_user_id === currentUserId && (
                                                    <Badge variant="outline" className="text-xs">You</Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                To: {selectedMessage.to_user?.name || selectedMessage.to_user?.email || "Unknown"}
                                                {selectedMessage.to_user_id === currentUserId && " (You)"}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {format(new Date(selectedMessage.createdAt), "PPpp")}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <ScrollArea className="flex-1 p-4">
                                    <div className="prose prose-sm dark:prose-invert max-w-none">
                                        <div className="whitespace-pre-wrap">{selectedMessage.body}</div>
                                    </div>
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center">
                                <MailPlus className="h-16 w-16 text-muted-foreground/30 mb-4" />
                                <p className="text-muted-foreground">Select a message to read</p>
                                <p className="text-sm text-muted-foreground/70 mt-1">
                                    Or compose a new message to your team
                                </p>
                                <Button
                                    variant="outline"
                                    className="mt-4 gap-2"
                                    onClick={() => setComposeOpen(true)}
                                >
                                    <PenBox className="h-4 w-4" />
                                    Compose Message
                                </Button>
                            </div>
                        )}
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>

            {/* Compose Dialog */}
            <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>New Message</DialogTitle>
                        <DialogDescription>
                            Send a message to a team member
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="to">To</Label>
                            <Select value={composeToUserId} onValueChange={setComposeToUserId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {teamMembers
                                        .filter(m => m.id !== currentUserId)
                                        .map((member) => (
                                            <SelectItem key={member.id} value={member.id}>
                                                {member.name || member.email || "Unknown"}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                placeholder="Message subject"
                                value={composeSubject}
                                onChange={(e) => setComposeSubject(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="body">Message</Label>
                            <Textarea
                                id="body"
                                placeholder="Write your message..."
                                rows={8}
                                value={composeBody}
                                onChange={(e) => setComposeBody(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setComposeOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSendMessage} disabled={isSending}>
                            {isSending ? "Sending..." : "Send Message"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
