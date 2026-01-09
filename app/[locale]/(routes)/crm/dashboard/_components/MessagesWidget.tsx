"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { MessageSquare, CalendarIcon, ArrowRight, User, FileInput, FileText } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

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

export default function MessagesWidget({ messages }: MessagesWidgetProps) {
    const [open, setOpen] = useState(false);

    // Calculate counts
    const unreadMessagesCount = messages.filter(m => m.type === 'message').length;
    const newFormsCount = messages.filter(m => m.type === 'form').length;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-500 border-cyan-500/20 hover:border-cyan-500/40 border-dashed w-full justify-between">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="hidden sm:inline">Messages</span>
                    </div>
                    <Badge className="ml-1 px-1.5 h-5 min-w-[1.25rem] flex items-center justify-center bg-cyan-500 hover:bg-cyan-600 border-none text-white">
                        {messages.length}
                    </Badge>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-cyan-500">
                        <MessageSquare className="h-5 w-5" />
                        Inbox & Notifications
                    </DialogTitle>
                    <DialogDescription>
                        You have {messages.length} new items ({unreadMessagesCount} messages, {newFormsCount} forms).
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                    <div className="space-y-3">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground opacity-60">
                                <MessageSquare className="h-12 w-12 mb-3" />
                                <p>All caught up!</p>
                            </div>
                        )}

                        {messages.map((item) => (
                            <div key={item.id} className="group flex items-start justify-between gap-3 p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
                                <div className="space-y-1.5 overflow-hidden w-full">
                                    <div className="flex items-center gap-2">
                                        {item.type === 'message' ? (
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={item.sender.avatar || undefined} />
                                                <AvatarFallback className="text-[10px] bg-cyan-100 text-cyan-700">
                                                    {item.sender.name.substring(0, 2).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        ) : (
                                            <div className="h-6 w-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                                                <FileText className="h-3 w-3" />
                                            </div>
                                        )}

                                        <span className="font-medium truncate block text-sm">
                                            {item.sender.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                                            {format(new Date(item.createdAt), "MMM d")}
                                        </span>
                                    </div>

                                    <div className="font-medium text-sm truncate flex items-center gap-2">
                                        {item.type === 'form' && <Badge variant="outline" className="text-[10px] h-4 px-1 py-0">Form</Badge>}
                                        {item.title}
                                    </div>

                                    {item.body && (
                                        <p className="text-xs text-muted-foreground line-clamp-2">
                                            {item.body}
                                        </p>
                                    )}
                                </div>

                                <div className="shrink-0 pt-0.5 self-center">
                                    <Link href={item.url}>
                                        <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <ArrowRight className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <div className="mt-4 pt-4 border-t flex justify-end">
                    <Link href="/messages">
                        <Button variant="ghost" className="text-cyan-500 hover:text-cyan-600 hover:bg-cyan-500/10">
                            Go to Inbox <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    );
}
