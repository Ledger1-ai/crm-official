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
} from "lucide-react";

import { AccountSwitcher } from "@/app/(routes)/emails/components/account-switcher";
import { Nav } from "@/app/(routes)/emails/components/nav";
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
import { MessageList } from "./message-list";
import { MessageDisplay } from "./message-display";
import { ComposeDialog } from "./compose-dialog";
import { useRouter } from "next/navigation";
import { atom, useAtom } from "jotai";
import { InternalMessageData, TeamMember } from "./messages";

// Atom for message selection state
const messageSelectedAtom = atom<string | null>(null);
export const useMessageMail = () => useAtom(messageSelectedAtom);

interface MessagesMailProps {
    accounts: {
        label: string;
        email: string;
        icon: React.ReactNode;
    }[];
    mails: InternalMessageData[];
    defaultLayout: number[] | undefined;
    defaultCollapsed?: boolean;
    navCollapsedSize: number;
    currentUserId: string;
    teamMembers: TeamMember[];
}

export function MessagesMailComponent({
    accounts,
    mails,
    defaultLayout = [265, 440, 655],
    defaultCollapsed = false,
    navCollapsedSize,
    currentUserId,
    teamMembers,
}: MessagesMailProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);
    const [selectedMail, setSelectedMail] = useMessageMail();
    const [composeOpen, setComposeOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [activeNav, setActiveNav] = React.useState("inbox");
    const router = useRouter();

    // Filter mails based on active nav and search
    const filteredMails = React.useMemo(() => {
        let filtered = mails;

        // Filter by nav
        switch (activeNav) {
            case "inbox":
                filtered = mails.filter(m =>
                    m.recipients.some(r => r.recipient_id === currentUserId && !r.is_archived && !r.is_deleted)
                );
                break;
            case "sent":
                filtered = mails.filter(m => m.sender_id === currentUserId);
                break;
            case "drafts":
                filtered = mails.filter(m => m.labels?.includes("draft"));
                break;
            case "trash":
                filtered = mails.filter(m =>
                    m.recipients.some(r => r.recipient_id === currentUserId && r.is_deleted)
                );
                break;
            case "archive":
                filtered = mails.filter(m =>
                    m.recipients.some(r => r.recipient_id === currentUserId && r.is_archived)
                );
                break;
            default:
                break;
        }

        // Filter by search
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                m =>
                    m.subject.toLowerCase().includes(query) ||
                    m.body_text?.toLowerCase().includes(query) ||
                    m.sender_name?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [mails, activeNav, searchQuery, currentUserId]);

    const inboxCount = mails.filter(m =>
        m.recipients.some(r => r.recipient_id === currentUserId && !r.is_read && !r.is_archived && !r.is_deleted)
    ).length;

    const sentCount = mails.filter(m => m.sender_id === currentUserId).length;

    const selectedMessage = filteredMails.find(item => item.id === selectedMail) || null;

    return (
        <TooltipProvider delayDuration={0}>
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
                            <AccountSwitcher isCollapsed={isCollapsed} accounts={accounts} />
                        </div>
                    </div>
                    <Separator />
                    <div className={cn(isCollapsed ? "block" : "hidden")}>
                        <Nav
                            isCollapsed={isCollapsed}
                            links={[
                                {
                                    title: "Compose",
                                    label: "",
                                    icon: PenBox,
                                    variant: "ghost",
                                    onClick: () => setComposeOpen(true),
                                },
                            ]}
                        />
                    </div>
                    <div className={cn(!isCollapsed ? "block p-2" : "hidden")}>
                        <button
                            onClick={() => setComposeOpen(true)}
                            className="w-full flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                        >
                            <PenBox className="h-4 w-4" />
                            Compose
                        </button>
                    </div>
                    <Nav
                        isCollapsed={isCollapsed}
                        links={[
                            {
                                title: "Inbox",
                                label: inboxCount > 0 ? String(inboxCount) : "",
                                icon: Inbox,
                                variant: activeNav === "inbox" ? "default" : "ghost",
                                onClick: () => setActiveNav("inbox"),
                            },
                            {
                                title: "Drafts",
                                label: "",
                                icon: File,
                                variant: activeNav === "drafts" ? "default" : "ghost",
                                onClick: () => setActiveNav("drafts"),
                            },
                            {
                                title: "Sent",
                                label: sentCount > 0 ? String(sentCount) : "",
                                icon: Send,
                                variant: activeNav === "sent" ? "default" : "ghost",
                                onClick: () => setActiveNav("sent"),
                            },
                            {
                                title: "Trash",
                                label: "",
                                icon: Trash2,
                                variant: activeNav === "trash" ? "default" : "ghost",
                                onClick: () => setActiveNav("trash"),
                            },
                            {
                                title: "Archive",
                                label: "",
                                icon: Archive,
                                variant: activeNav === "archive" ? "default" : "ghost",
                                onClick: () => setActiveNav("archive"),
                            },
                        ]}
                    />
                    <Separator />
                    <Nav
                        isCollapsed={isCollapsed}
                        links={[
                            {
                                title: "Form Builder",
                                label: "",
                                icon: FileText,
                                variant: "ghost",
                                href: "/messages/forms",
                            },
                            {
                                title: "Submissions",
                                label: "",
                                icon: Users2,
                                variant: "ghost",
                                href: "/messages/submissions",
                            },
                        ]}
                    />
                </ResizablePanel>
                <ResizableHandle withHandle />
                <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
                    <Tabs defaultValue="all">
                        <div className="flex items-center px-4 py-2">
                            <h1 className="text-xl font-bold capitalize">{activeNav}</h1>
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
                            <form onSubmit={e => e.preventDefault()}>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search messages..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </form>
                        </div>
                        <TabsContent value="all" className="m-0">
                            <MessageList
                                items={filteredMails}
                                selectedId={selectedMail}
                                onSelect={setSelectedMail}
                                currentUserId={currentUserId}
                            />
                        </TabsContent>
                        <TabsContent value="unread" className="m-0">
                            <MessageList
                                items={filteredMails.filter(m =>
                                    m.recipients.some(r => r.recipient_id === currentUserId && !r.is_read)
                                )}
                                selectedId={selectedMail}
                                onSelect={setSelectedMail}
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

            <ComposeDialog
                open={composeOpen}
                onOpenChange={setComposeOpen}
                teamMembers={teamMembers}
                currentUserId={currentUserId}
            />
        </TooltipProvider>
    );
}
