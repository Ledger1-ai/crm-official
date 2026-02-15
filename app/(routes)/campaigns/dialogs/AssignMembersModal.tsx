"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
    Users,
    UserPlus,
    Crown,
    Loader2,
    Search,
    Check,
    X,
    Trash2,
} from "lucide-react";

type TeamMember = {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    team_role?: string;
};

type ProjectMember = {
    id: string;
    user: string;
    role: string;
    assignedAt: string;
    member?: TeamMember;
};

type Props = {
    projectId: string;
    projectTitle: string;
    isOpen: boolean;
    onClose: () => void;
    onUpdate?: () => void;
};

export default function AssignMembersModal({
    projectId,
    projectTitle,
    isOpen,
    onClose,
    onUpdate,
}: Props) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assignedMembers, setAssignedMembers] = useState<ProjectMember[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState<string>("MEMBER");

    const { toast } = useToast();

    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch team members
                const teamRes = await fetch("/api/team/members");
                if (teamRes.ok) {
                    const data = await teamRes.json();
                    setTeamMembers(data.members || []);
                }

                // Fetch current project members
                const membersRes = await fetch(`/api/campaigns/${projectId}/members`);
                if (membersRes.ok) {
                    const data = await membersRes.json();
                    setAssignedMembers(data.members || []);
                }
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [isOpen, projectId]);

    const assignedUserIds = assignedMembers.map((m) => m.user);

    const filteredMembers = teamMembers.filter(
        (member) =>
            !assignedUserIds.includes(member.id) &&
            (member.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.email?.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const handleAssign = async (userId: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/campaigns/${projectId}/members`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId, role: selectedRole }),
            });

            if (!res.ok) throw new Error("Failed to assign member");

            const data = await res.json();
            setAssignedMembers((prev) => [...prev, data.member]);

            toast({
                title: "Member Assigned",
                description: "Team member has been assigned to this campaign.",
            });

            onUpdate?.();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to assign member",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async (membershipId: string) => {
        setSaving(true);
        try {
            const res = await fetch(`/api/campaigns/${projectId}/members/${membershipId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to remove member");

            setAssignedMembers((prev) => prev.filter((m) => m.id !== membershipId));

            toast({
                title: "Member Removed",
                description: "Team member has been removed from this campaign.",
            });

            onUpdate?.();
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to remove member",
            });
        } finally {
            setSaving(false);
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return "?";
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                            <Users className="w-5 h-5 text-indigo-400" />
                        </div>
                        Assign Members
                    </DialogTitle>
                    <DialogDescription>
                        Assign team members to <strong>{projectTitle}</strong>
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Currently Assigned */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Crown className="w-4 h-4" />
                                Assigned Members ({assignedMembers.length})
                            </h4>
                            {assignedMembers.length === 0 ? (
                                <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                                    No members assigned yet
                                </div>
                            ) : (
                                <ScrollArea className="max-h-[180px]">
                                    <AnimatePresence>
                                        {assignedMembers.map((membership) => {
                                            const member = teamMembers.find((m) => m.id === membership.user);
                                            return (
                                                <motion.div
                                                    key={membership.id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 10 }}
                                                    className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-emerald-500/5 to-transparent border border-emerald-500/20 mb-2"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9">
                                                            <AvatarImage src={member?.avatar} />
                                                            <AvatarFallback className="bg-emerald-500/20 text-emerald-400 text-xs">
                                                                {getInitials(member?.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium">{member?.name || "Unknown"}</p>
                                                            <p className="text-xs text-muted-foreground">{member?.email}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="text-xs">
                                                            {membership.role}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                                            onClick={() => handleRemove(membership.id)}
                                                            disabled={saving}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </ScrollArea>
                            )}
                        </div>

                        {/* Add New Members */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <UserPlus className="w-4 h-4" />
                                Add Members
                            </h4>

                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search team members..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger className="w-[120px]">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LEAD">Lead</SelectItem>
                                        <SelectItem value="MEMBER">Member</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <ScrollArea className="max-h-[200px]">
                                {filteredMembers.length === 0 ? (
                                    <div className="text-sm text-muted-foreground text-center py-4">
                                        {searchQuery ? "No members match your search" : "All team members are assigned"}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {filteredMembers.map((member) => (
                                            <motion.div
                                                key={member.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 hover:bg-accent/30 transition-all group"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-9 w-9">
                                                        <AvatarImage src={member.avatar} />
                                                        <AvatarFallback className="bg-muted text-xs">
                                                            {getInitials(member.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{member.name}</p>
                                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/30 hover:border-indigo-500/50"
                                                    onClick={() => handleAssign(member.id)}
                                                    disabled={saving}
                                                >
                                                    {saving ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <UserPlus className="w-4 h-4 mr-1" />
                                                            Assign
                                                        </>
                                                    )}
                                                </Button>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4 border-t">
                    <Button variant="outline" onClick={onClose}>
                        Done
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
