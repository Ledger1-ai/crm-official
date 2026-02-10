"use client";

import { useState } from "react";
import {
    Bell,
    Check,
    Info,
    AlertTriangle,
    CheckCircle2,
    User,
    Clock,
    Search,
    ChevronRight,
    Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { markAsRead, markAllAsRead } from "@/actions/crm/notifications";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";

interface NotificationsClientProps {
    initialNotifications: any[];
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
    const [notifications, setNotifications] = useState(initialNotifications);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const filteredNotifications = notifications.filter(n =>
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleMarkAsRead = async (id: string, link?: string) => {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        if (link) {
            router.push(link);
        }
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "SUCCESS": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
            case "WARNING": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
            case "ERROR": return <AlertTriangle className="h-5 w-5 text-rose-500" />;
            case "APPROVAL": return <Check className="h-5 w-5 text-blue-500" />;
            case "MENTION": return <User className="h-5 w-5 text-violet-500" />;
            default: return <Info className="h-5 w-5 text-blue-500" />;
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search notifications..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
                        Mark All as Read
                    </Button>
                </div>
            </div>

            <div className="bg-card rounded-xl border border-border/50 overflow-hidden">
                {filteredNotifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
                        <div className="p-4 bg-muted rounded-full">
                            <Bell className="h-8 w-8 opacity-20" />
                        </div>
                        <div className="text-center">
                            <p className="font-semibold text-lg text-foreground">All caught up!</p>
                            <p className="text-sm">No notifications matching your search.</p>
                        </div>
                    </div>
                ) : (
                    <div className="divide-y divide-border/50">
                        {filteredNotifications.map((n) => (
                            <div
                                key={n.id}
                                className={cn(
                                    "p-6 flex gap-4 hover:bg-muted/30 transition-all cursor-pointer group relative",
                                    !n.isRead && "bg-primary/5"
                                )}
                                onClick={() => handleMarkAsRead(n.id, n.link)}
                            >
                                <div className="mt-1 shrink-0 bg-background rounded-full p-2 shadow-sm border border-border/50">
                                    {getIcon(n.type)}
                                </div>
                                <div className="flex-1 space-y-1.5 min-w-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <h3 className={cn("text-sm font-bold truncate", !n.isRead ? "text-foreground" : "text-muted-foreground")}>
                                            {n.title}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                                            <Clock className="h-3 w-3" />
                                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                                        </div>
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {n.message}
                                    </p>
                                    <div className="pt-2 flex items-center gap-3">
                                        {n.link && (
                                            <Button variant="link" className="p-0 h-auto text-xs text-primary font-bold gap-1 group">
                                                View Details
                                                <ChevronRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        )}
                                        {!n.isRead && (
                                            <Badge variant="default" className="text-[9px] px-1.5 h-4 bg-primary text-primary-foreground">NEW</Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
