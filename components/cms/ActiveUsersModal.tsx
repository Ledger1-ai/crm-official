"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getActiveUsers } from "@/actions/cms/get-active-users";
import { Loader2, Circle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActiveUsersModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ActiveUsersModal({ isOpen, onClose }: ActiveUsersModalProps) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setLoading(true);
            getActiveUsers()
                .then(data => setUsers(data))
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [isOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md bg-[#0A0A0B] border-white/10 text-white p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 bg-white/5 border-b border-white/5">
                    <DialogTitle className="flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        Active Users
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                        Team members active recently.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-[400px] p-6">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {users.map((user) => {
                                const isOnline = user.lastLoginAt && (new Date().getTime() - new Date(user.lastLoginAt).getTime()) < 1000 * 60 * 15; // 15 mins

                                return (
                                    <div key={user.id} className="flex items-center justify-between group p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar className="h-10 w-10 border border-white/10">
                                                    <AvatarImage src={user.avatar || ""} />
                                                    <AvatarFallback className="bg-slate-800 text-slate-300">
                                                        {user.name?.[0] || user.email?.[0] || "?"}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {isOnline && (
                                                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-black rounded-full flex items-center justify-center">
                                                        <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full border border-black" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-white">{user.name || "Unknown"}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            {isOnline ? (
                                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                                                    Online
                                                </Badge>
                                            ) : (
                                                <span className="text-[10px] text-slate-600">
                                                    {user.lastLoginAt ? formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true }) : "Never"}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}

                            {users.length === 0 && (
                                <div className="text-center text-slate-500 text-sm py-4">
                                    No active users found.
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
