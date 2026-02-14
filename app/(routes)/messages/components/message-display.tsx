"use client";
import { format } from "date-fns";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { Archive, Forward, Reply, ReplyAll, Star, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InternalMessageData, TeamMember } from "./messages";

interface MessageDisplayProps {
    message: InternalMessageData | null;
    currentUserId: string;
    teamMembers: TeamMember[];
}

export function MessageDisplay({ message, currentUserId, teamMembers }: MessageDisplayProps) {
    if (!message) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                    <p>Select a message to view</p>
                </div>
            </div>
        );
    }

    const sender = teamMembers.find(m => m.id === message.sender_id);

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center p-2">
                <div className="flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!message}>
                                <Archive className="h-4 w-4" />
                                <span className="sr-only">Archive</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Archive</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!message}>
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Move to trash</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Move to trash</TooltipContent>
                    </Tooltip>
                </div>
                <div className="ml-auto flex items-center gap-2">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!message}>
                                <Reply className="h-4 w-4" />
                                <span className="sr-only">Reply</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reply</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!message}>
                                <ReplyAll className="h-4 w-4" />
                                <span className="sr-only">Reply all</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reply all</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={!message}>
                                <Forward className="h-4 w-4" />
                                <span className="sr-only">Forward</span>
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>Forward</TooltipContent>
                    </Tooltip>
                </div>
                <Separator orientation="vertical" className="mx-2 h-6" />
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={!message}>
                            <Star className={`h-4 w-4 ${message.is_starred ? "fill-yellow-400 text-yellow-400" : ""}`} />
                            <span className="sr-only">Star</span>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>Star</TooltipContent>
                </Tooltip>
            </div>
            <Separator />
            <div className="flex flex-1 flex-col">
                <div className="flex items-start p-4">
                    <div className="flex items-start gap-4 text-sm">
                        <Avatar>
                            <AvatarImage src={sender?.avatar || undefined} alt={message.sender_name || ""} />
                            <AvatarFallback>
                                {(message.sender_name || message.sender_email || "?")
                                    .split(" ")
                                    .map((chunk) => chunk[0])
                                    .join("")
                                    .toUpperCase()
                                    .slice(0, 2)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="grid gap-1">
                            <div className="font-semibold">{message.sender_name || message.sender_email}</div>
                            <div className="line-clamp-1 text-xs">{message.subject}</div>
                            <div className="line-clamp-1 text-xs">
                                <span className="font-medium">To:</span>{" "}
                                {message.recipients.map((r, i) => {
                                    const recipient = teamMembers.find(m => m.id === r.recipient_id);
                                    return (
                                        <span key={r.id}>
                                            {recipient?.name || recipient?.email || "Unknown"}
                                            {i < message.recipients.length - 1 ? ", " : ""}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                    <div className="ml-auto text-xs text-muted-foreground">
                        {format(new Date(message.createdAt), "PPpp")}
                    </div>
                </div>
                <Separator />
                <div className="flex-1 whitespace-pre-wrap p-4 text-sm">
                    {message.body_html ? (
                        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(message.body_html) }} />
                    ) : (
                        message.body_text
                    )}
                </div>
            </div>
        </div>
    );
}
