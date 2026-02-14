"use client";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InternalMessageData } from "./messages";

interface MessageListProps {
    items: InternalMessageData[];
    selectedId: string | null;
    onSelect: (id: string) => void;
    currentUserId: string;
}

export function MessageList({ items, selectedId, onSelect, currentUserId }: MessageListProps) {
    return (
        <ScrollArea className="h-[calc(100vh-240px)]">
            <div className="flex flex-col gap-2 p-4 pt-0">
                {items.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        No messages found
                    </div>
                ) : (
                    items.map((item) => {
                        const recipientStatus = item.recipients.find(r => r.recipient_id === currentUserId);
                        const isUnread = recipientStatus ? !recipientStatus.is_read : false;

                        return (
                            <button
                                key={item.id}
                                className={cn(
                                    "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                                    selectedId === item.id && "bg-muted",
                                    isUnread && "border-primary/50"
                                )}
                                onClick={() => onSelect(item.id)}
                            >
                                <div className="flex w-full flex-col gap-1">
                                    <div className="flex items-center">
                                        <div className="flex items-center gap-2">
                                            <div className={cn("font-semibold", isUnread && "text-primary")}>
                                                {item.sender_name || item.sender_email || "Unknown"}
                                            </div>
                                            {isUnread && (
                                                <span className="flex h-2 w-2 rounded-full bg-primary" />
                                            )}
                                        </div>
                                        <div className={cn("ml-auto text-xs", isUnread ? "text-foreground" : "text-muted-foreground")}>
                                            {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <div className={cn("text-xs font-medium", isUnread && "text-foreground")}>
                                        {item.subject}
                                    </div>
                                </div>
                                <div className="line-clamp-2 text-xs text-muted-foreground">
                                    {item.body_text?.substring(0, 300)}
                                </div>
                                {item.labels.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        {item.labels.map((label) => (
                                            <Badge key={label} variant={getBadgeVariant(label)}>
                                                {label}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>
        </ScrollArea>
    );
}

function getBadgeVariant(label: string): "default" | "outline" | "secondary" | "destructive" {
    switch (label.toLowerCase()) {
        case "important":
            return "default";
        case "urgent":
            return "destructive";
        case "work":
            return "secondary";
        default:
            return "outline";
    }
}
