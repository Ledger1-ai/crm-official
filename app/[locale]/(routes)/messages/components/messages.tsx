"use client";
import * as React from "react";
import {
    AlertCircle,
    Archive,
    ClipboardList,
    File,
    Inbox,
    PenBox,
    Search,
    Send,
    Star,
    Trash2,
    Users2,
} from "lucide-react";

import { MessageDisplay } from "./message-display";
import { MessageList } from "./message-list";
import { MessagesNav } from "./messages-nav";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
    ResizableHandle,
    ResizablePanel,
    ResizablePanelGroup,
} from "@/components/ui/resizable";
import { useState } from "react";
import { ComposeDialog } from "./compose-dialog";

export type TeamMember = {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
};

export type MessageRecipient = {
    id: string;
    message_id: string;
    recipient_id: string;
    recipient_type: string;
    is_read: boolean;
    is_starred: boolean;
    is_archived: boolean;
    is_deleted: boolean;
    read_at: Date | null;
    createdAt: Date;
};

export type InternalMessageData = {
    id: string;
    sender_id: string;
    sender_name: string | null;
    sender_email: string | null;
    subject: string;
    body_text: string | null;
    body_html: string | null;
    status: string;
    priority: string;
    is_starred: boolean;
    parent_id: string | null;
    thread_id: string | null;
    labels: string[];
    attachment_ids: string[];
    team_id: string;
    createdAt: Date;
    updatedAt: Date | null;
    sentAt: Date | null;
    recipients: MessageRecipient[];
};

interface MessagesProps {
    teamMembers: TeamMember[];
    messages: InternalMessageData[];
    currentUserId: string;
    defaultLayout: number[] | undefined;
    defaultCollapsed?: boolean;
    navCollapsedSize: number;
    formSubmissionsCount: number;
}

export function MessagesComponent({
    teamMembers,
    messages,
    currentUserId,
    defaultLayout = [265, 440, 655],
    defaultCollapsed = false,
    navCollapsedSize,
    formSubmissionsCount,
}: MessagesProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [activeFolder, setActiveFolder] = useState<string>("inbox");
    const [composeOpen, setComposeOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Filter messages based on active folder
    const filteredMessages = React.useMemo(() => {
        let filtered = messages;

        // Filter by folder
        switch (activeFolder) {
            case "inbox":
                filtered = messages.filter(m =>
                    m.recipients.some(r => r.recipient_id === currentUserId && !r.is_archived && !r.is_deleted)
                );
                break;
            case "sent":
                filtered = messages.filter(m => m.sender_id === currentUserId);
                break;
            case "starred":
                filtered = messages.filter(m =>
                    m.is_starred || m.recipients.some(r => r.recipient_id === currentUserId && r.is_starred)
                );
                break;
            case "archive":
                filtered = messages.filter(m =>
                    m.recipients.some(r => r.recipient_id === currentUserId && r.is_archived)
                );
                break;
            case "trash":
                filtered = messages.filter(m =>
                    m.recipients.some(r => r.recipient_id === currentUserId && r.is_deleted)
                );
                break;
            default:
                break;
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(m =>
                m.subject.toLowerCase().includes(query) ||
                m.body_text?.toLowerCase().includes(query) ||
                m.sender_name?.toLowerCase().includes(query) ||
                m.sender_email?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [messages, activeFolder, currentUserId, searchQuery]);

    const selectedMessage = messages.find(m => m.id === selectedMessageId) || null;

    // Count unread messages
    const unreadCount = messages.filter(m =>
        m.recipients.some(r => r.recipient_id === currentUserId && !r.is_read && !r.is_archived && !r.is_deleted)
    ).length;

    return (
        <TooltipProvider delayDuration={0}>
            <ComposeDialog
                open={composeOpen}
                onOpenChange={setComposeOpen}
                teamMembers={teamMembers}
                currentUserId={currentUserId}
            />
            <ResizablePanelGroup
                direction="horizontal"
                onLayout={(sizes: number[]) => {
                    document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`;
                }}
                className="h-full items-stretch"
            >
                <ResizablePanel
                    defaultSize={defaultLayout[0]}
                    collapsedSize={navCollapsedSize}
                    collapsible={true}
                    minSize={15}
                    maxSize={20}
                    onCollapse={() => {
                        setIsCollapsed(true);
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
                    }}
                    onExpand={() => {
                        setIsCollapsed(false);
                        document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`;
                    }}
                    className={cn(isCollapsed && "transition-all duration-300 ease-in-out")}
                >
                    <div className="flex items-center p-2">
                        <div className="w-full">
                            <button
                                onClick={() => setComposeOpen(true)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
                            >
                                <PenBox className="h-4 w-4" />
                                {!isCollapsed && <span>Compose</span>}
                            </button>
                        </div>
                    </div>
                    <Separator />
                    <MessagesNav
                        isCollapsed={isCollapsed}
                        activeFolder={activeFolder}
                        onFolderChange={setActiveFolder}
                        links={[
                            {
                                title: "Inbox",
                                label: unreadCount > 0 ? String(unreadCount) : "",
                                icon: Inbox,
                                variant: activeFolder === "inbox" ? "default" : "ghost",
                                folder: "inbox",
                            },
                            {
                                title: "Drafts",
                                label: "",
                                icon: File,
                                variant: activeFolder === "drafts" ? "default" : "ghost",
                                folder: "drafts",
                            },
                            {
                                title: "Sent",
                                label: "",
                                icon: Send,
                                variant: activeFolder === "sent" ? "default" : "ghost",
                                folder: "sent",
                            },
                            {
                                title: "Starred",
                                label: "",
                                icon: Star,
                                variant: activeFolder === "starred" ? "default" : "ghost",
                                folder: "starred",
                            },
                            {
                                title: "Archive",
                                label: "",
                                icon: Archive,
                                variant: activeFolder === "archive" ? "default" : "ghost",
                                folder: "archive",
                            },
                            {
                                title: "Trash",
                                label: "",
                                icon: Trash2,
                                variant: activeFolder === "trash" ? "default" : "ghost",
                                folder: "trash",
                            },
                        ]}
                    />
                    <Separator />
                    <MessagesNav
                        isCollapsed={isCollapsed}
                        activeFolder={activeFolder}
                        onFolderChange={setActiveFolder}
                        links={[
                            {
                                title: "Form Submissions",
                                label: formSubmissionsCount > 0 ? String(formSubmissionsCount) : "",
                                icon: ClipboardList,
                                variant: activeFolder === "submissions" ? "default" : "ghost",
                                folder: "submissions",
                                href: "/messages/submissions",
                            },
                            {
                                title: "Team",
                                label: "",
                                icon: Users2,
                                variant: "ghost",
                                folder: "team",
                            },
                            {
                                title: "Updates",
                                label: "",
                                icon: AlertCircle,
                                variant: "ghost",
                                folder: "updates",
                            },
                        ]}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
                    <Tabs defaultValue="all">
                        <div className="flex items-center px-4 py-2">
                            <h1 className="text-xl font-bold capitalize">{activeFolder}</h1>
                            <TabsList className="ml-auto">
                                <TabsTrigger value="all" className="text-zinc-600 dark:text-zinc-200">
                                    All
                                </TabsTrigger>
                                <TabsTrigger value="unread" className="text-zinc-600 dark:text-zinc-200">
                                    Unread
                                </TabsTrigger>
                            </TabsList>
                        </div>
                        <Separator />
                        <div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                            <form onSubmit={(e) => e.preventDefault()}>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search messages"
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </form>
                        </div>
                        <TabsContent value="all" className="m-0">
                            <MessageList
                                items={filteredMessages}
                                selectedId={selectedMessageId}
                                onSelect={setSelectedMessageId}
                                currentUserId={currentUserId}
                            />
                        </TabsContent>
                        <TabsContent value="unread" className="m-0">
                            <MessageList
                                items={filteredMessages.filter(m =>
                                    m.recipients.some(r => r.recipient_id === currentUserId && !r.is_read)
                                )}
                                selectedId={selectedMessageId}
                                onSelect={setSelectedMessageId}
                                currentUserId={currentUserId}
                            />
                        </TabsContent>
                    </Tabs>
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[2]}>
                    <MessageDisplay
                        message={selectedMessage}
                        currentUserId={currentUserId}
                        teamMembers={teamMembers}
                    />
                </ResizablePanel>
            </ResizablePanelGroup>
        </TooltipProvider>
    );
}
