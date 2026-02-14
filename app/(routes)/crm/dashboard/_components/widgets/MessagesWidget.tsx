"use client";

import React, { useState, useTransition } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { MessageSquare, CalendarIcon, ArrowRight, User, FileText, SendHorizontal, Check } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { markNotificationRead } from "@/actions/dashboard/mark-notification-read";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface NotificationItem {
    id: string;
    type: 'message' | 'form';
    createdAt: Date;
    title: string;
    body: string;
    sender: {
        name: string;
        email?: string | null;
        avatar?: string | null;
    };
    url: string;
}

interface MessagesWidgetProps {
    messages: NotificationItem[];
}

export const MessagesWidget = ({ messages: initialMessages }: MessagesWidgetProps) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [messages, setMessages] = useState<NotificationItem[]>(initialMessages);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    // Sync with props
    React.useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    const handleMarkRead = async (id: string, type: 'message' | 'form') => {
        const previousMessages = [...messages];
        setMessages(prev => prev.filter(m => m.id !== id));

        startTransition(async () => {
            try {
                const result = await markNotificationRead(id, type);
                if (result.success) {
                    toast.success("Marked as read");
                    router.refresh();
                } else {
                    setMessages(previousMessages);
                    toast.error("Failed to mark as read");
                }
            } catch (error) {
                setMessages(previousMessages);
                toast.error("Something went wrong");
            }
        });
    };

    const filteredMessages = messages.filter(m => {
        return (
            m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.sender.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const rightAction = (
        <Button
            size="sm"
            variant="outline"
            className="h-7 px-3 text-[10px] font-bold border-white/10 bg-white/5 hover:bg-white/10"
        >
            <SendHorizontal size={12} className="mr-1.5" />
            MESSAGE
        </Button>
    );

    return (
        <WidgetWrapper
            title="Inbox"
            icon={MessageSquare}
            iconColor="text-cyan-400"
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            footerHref="/messages"
            footerLabel="Go to Inbox"
            count={messages.length}
            rightAction={rightAction}
        >
            <div className="space-y-1 pb-4 mt-2">
                {filteredMessages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/30">
                        <MessageSquare className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-[11px] font-medium italic">Your inbox is empty</p>
                    </div>
                ) : (
                    filteredMessages.map((item) => (
                        <div
                            key={item.id}
                            className="group flex items-start justify-between gap-3 p-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-300"
                        >
                            <div className="space-y-1.5 overflow-hidden flex-1">
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6 ring-1 ring-white/10">
                                        <AvatarImage src={item.sender.avatar || undefined} />
                                        <AvatarFallback className="text-[9px] bg-white/5 text-muted-foreground uppercase font-bold">
                                            {item.sender.name.substring(0, 2)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-semibold text-white/90 truncate group-hover:text-primary transition-colors">
                                        {item.sender.name}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground ml-auto font-medium opacity-60">
                                        {format(new Date(item.createdAt), "MMM d")}
                                    </span>
                                </div>

                                <div className="space-y-0.5" onClick={() => handleMarkRead(item.id, item.type)}>
                                    <div className="font-bold text-[11px] truncate flex items-center gap-1.5 text-white/80 group-hover:text-white transition-colors cursor-pointer">
                                        {item.type === 'form' && (
                                            <Badge variant="outline" className="text-[8px] h-3.5 px-1 py-0 border-white/10 bg-white/5 text-muted-foreground font-medium uppercase tracking-tighter">Form</Badge>
                                        )}
                                        {item.title}
                                    </div>
                                    {item.body && (
                                        <p className="text-[10px] text-muted-foreground/70 line-clamp-1 font-medium italic cursor-pointer">
                                            {item.body}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1 pt-0.5 self-center">
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleMarkRead(item.id, item.type)}
                                    className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-400 transition-all duration-300"
                                    title="Mark as Read"
                                >
                                    <Check className="h-4 w-4" />
                                </Button>
                                <Link href={item.url}>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-primary hover:text-white transition-all duration-300"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </WidgetWrapper>
    );
};
