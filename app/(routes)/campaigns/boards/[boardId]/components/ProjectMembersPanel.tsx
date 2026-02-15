"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    boardId: string;
};

export default function ProjectMembersPanel({ boardId }: Props) {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [assignedMembers, setAssignedMembers] = useState<ProjectMember[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedRole, setSelectedRole] = useState<string>("MEMBER");

    const { toast } = useToast();

    useEffect(() => {
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
                const membersRes = await fetch(`/api/campaigns/${boardId}/members`);
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
    }, [boardId]);

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
            const res = await fetch(`/api/campaigns/${boardId}/members`, {
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
            const res = await fetch(`/api/campaigns/${boardId}/members/${membershipId}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to remove member");

            setAssignedMembers((prev) => prev.filter((m) => m.id !== membershipId));

            toast({
                title: "Member Removed",
                description: "Team member has been removed from this campaign.",
            });
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

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-6 space-y-8">
            {/* Currently Assigned Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                        <Crown className="w-5 h-5 text-emerald-400" />
                    </div>
                    Assigned Members ({assignedMembers.length})
                </h3>

                {assignedMembers.length === 0 ? (
                    <div className="text-center py-12 border border-dashed rounded-xl bg-muted/20">
                        <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                        <p className="text-muted-foreground">No members assigned to this project yet</p>
                        <p className="text-sm text-muted-foreground mt-1">Add team members below to give them access</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <AnimatePresence>
                            {assignedMembers.map((membership) => {
                                const member = teamMembers.find((m) => m.id === membership.user) || membership.member;
                                return (
                                    <motion.div
                                        key={membership.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={member?.avatar} />
                                                <AvatarFallback className="bg-emerald-500/20 text-emerald-400">
                                                    {getInitials(member?.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{member?.name || "Unknown"}</p>
                                                <p className="text-sm text-muted-foreground">{member?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{membership.role}</Badge>
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
                    </div>
                )}
            </div>

            {/* Add Members Section */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
                        <UserPlus className="w-5 h-5 text-indigo-400" />
                    </div>
                    Add Members
                </h3>

                <div className="flex gap-3">
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
                        <SelectTrigger className="w-[130px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="LEAD">Lead</SelectItem>
                            <SelectItem value="MEMBER">Member</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredMembers.length === 0 ? (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                            {searchQuery ? "No members match your search" : "All team members are already assigned"}
                        </div>
                    ) : (
                        filteredMembers.map((member) => (
                            <motion.div
                                key={member.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center justify-between p-4 rounded-xl border hover:border-primary/30 hover:bg-accent/30 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={member.avatar} />
                                        <AvatarFallback className="bg-muted">
                                            {getInitials(member.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{member.name}</p>
                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                    </div>
                                </div>
                                <Button
                                    size="sm"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500"
                                    onClick={() => handleAssign(member.id)}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <>
                                            <UserPlus className="w-4 h-4 mr-1" />
                                            Add
                                        </>
                                    )}
                                </Button>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
