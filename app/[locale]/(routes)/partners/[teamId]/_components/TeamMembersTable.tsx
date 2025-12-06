"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { MoreHorizontal, Shield, User, Trash, Search, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import { updateMemberRole, removeMember, searchUsers, addMember } from "@/actions/teams/member-actions";


type Member = {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    team_role: string | null;
};

type Props = {
    teamId: string;
    members: Member[];
};

const TeamMembersTable = ({ teamId, members }: Props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // Add Member State
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [addOpen, setAddOpen] = useState(false);

    const handleRoleUpdate = async (userId: string, role: string) => {
        try {
            setIsLoading(true);
            const res = await updateMemberRole(userId, role);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Role updated");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to update");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (userId: string) => {
        if (!confirm("Are you sure? This will remove the user from the team.")) return;
        try {
            setIsLoading(true);
            const res = await removeMember(userId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Member removed");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to remove");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSearch = async (val: string) => {
        setSearchQuery(val);
        if (val.length > 2) {
            setSearchLoading(true);
            const users = await searchUsers(val);
            setSearchResults(users);
            setSearchLoading(false);
        } else {
            setSearchResults([]);
        }
    };

    const handleAdd = async (userId: string) => {
        try {
            const res = await addMember(teamId, userId);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Member added!");
                setAddOpen(false);
                setSearchQuery("");
                setSearchResults([]);
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to add");
        }
    }


    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Team Members</CardTitle>
                    <CardDescription>
                        Manage users assigned to this team.
                    </CardDescription>
                </div>

                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Member
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add Team Member</DialogTitle>
                            <DialogDescription>
                                Search for existing system users to add to this team.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                            />

                            <div className="space-y-2 border rounded-md p-2 h-[200px] overflow-y-auto">
                                {searchLoading && <p className="text-sm text-center py-2">Searching...</p>}
                                {searchResults.map(user => (
                                    <div key={user.id} className="flex justify-between items-center p-2 hover:bg-muted rounded">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatar || ""} />
                                                <AvatarFallback>{(user.name?.[0] || "U")}</AvatarFallback>
                                            </Avatar>
                                            <div className="text-sm">
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </div>
                                        {user.team_id ? (
                                            <Badge variant="secondary" className="text-xs">In Team</Badge>
                                        ) : (
                                            <Button size="sm" variant="ghost" onClick={() => handleAdd(user.id)}>Add</Button>
                                        )}
                                    </div>
                                ))}
                                {searchQuery.length > 2 && searchResults.length === 0 && !searchLoading && (
                                    <p className="text-sm text-center py-4 text-muted-foreground">No users found.</p>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>

            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {members.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-card/50">
                            <div className="flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={member.avatar || ""} />
                                    <AvatarFallback>{(member.name || member.email)[0].toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-medium text-sm">{member.name || "Unknown Name"}</p>
                                    <p className="text-xs text-muted-foreground">{member.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Badge variant={member.team_role === "OWNER" ? "default" : member.team_role === "ADMIN" ? "secondary" : "outline"}>
                                    {member.team_role || "MEMBER"}
                                </Badge>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" disabled={isLoading}>
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => handleRoleUpdate(member.id, "ADMIN")}>
                                            <Shield className="w-4 h-4 mr-2" /> Make Admin
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleRoleUpdate(member.id, "MEMBER")}>
                                            <User className="w-4 h-4 mr-2" /> Make Member
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-red-600" onClick={() => handleRemove(member.id)}>
                                            <Trash className="w-4 h-4 mr-2" /> Remove from Team
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                    ))}

                    {members.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            No members in this team yet.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default TeamMembersTable;
