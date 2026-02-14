"use client";

import { useEffect, useState, useCallback } from "react";
import { getUsers, deleteUser, toggleUserStatus } from "@/actions/cms/users";
import { UserManagementModal } from "@/components/cms/UserManagementModal";
import { Loader2, Plus, Search, MoreHorizontal, Pencil, Trash2, Shield, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";

export default function TeamPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any>(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getUsers(searchQuery);
            setUsers(data);
        } catch (error) {
            toast.error("Failed to load users");
        } finally {
            setLoading(false);
        }
    }, [searchQuery]);

    useEffect(() => {
        const debounce = setTimeout(fetchUsers, 300);
        return () => clearTimeout(debounce);
    }, [fetchUsers]);

    // Refresh when modal closes (if saved) - simplified by just refetching
    const handleModalClose = () => {
        setIsModalOpen(false);
        fetchUsers();
    };

    const handleEdit = (user: any) => {
        setSelectedUser(user);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setSelectedUser(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;

        const result = await deleteUser(id);
        if (result.success) {
            toast.success("User deleted");
            fetchUsers();
        } else {
            toast.error(result.error);
        }
    };

    const handleToggleStatus = async (user: any) => {
        const newStatus = user.userStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";
        const result = await toggleUserStatus(user.id, newStatus);
        if (result.success) {
            toast.success(`User ${newStatus === "ACTIVE" ? "activated" : "deactivated"}`);
            fetchUsers();
        } else {
            toast.error(result.error);
        }
    };

    return (
        <div className="p-8 space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white">Team & Admins</h1>
                    <p className="text-slate-400 mt-1">Manage system access, roles, and permissions.</p>
                </div>
                <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Plus className="h-4 w-4" /> Add Member
                </Button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 bg-[#0A0A0B] p-2 rounded-xl border border-white/10 w-fit">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                        placeholder="Search users..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 w-[300px] bg-transparent border-none focus-visible:ring-0 text-white placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-white/10 overflow-hidden bg-[#0A0A0B]/50 backdrop-blur-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-white/5 text-slate-400 font-medium">
                        <tr>
                            <th className="p-4">User</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Joined</th>
                            <th className="p-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading && users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                                    Loading team members...
                                </td>
                            </tr>
                        ) : users.map((user) => (
                            <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-white/10">
                                            <AvatarImage src={user.avatar} />
                                            <AvatarFallback className="bg-slate-800 text-slate-400">{user.name?.[0]?.toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-medium text-white">{user.name || "Unknown"}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    {user.assigned_role ? (
                                        <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20 gap-1.5">
                                            <Shield className="h-3 w-3" />
                                            {user.assigned_role.name}
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-slate-800 text-slate-500 border-white/5">
                                            No Role
                                        </Badge>
                                    )}
                                </td>
                                <td className="p-4">
                                    <Badge
                                        variant="outline"
                                        className={
                                            user.userStatus === "ACTIVE"
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                                : "bg-red-500/10 text-red-400 border-red-500/20"
                                        }
                                    >
                                        {user.userStatus}
                                    </Badge>
                                </td>
                                <td className="p-4 text-slate-500">
                                    {format(new Date(user.created_on), 'MMM d, yyyy')}
                                </td>
                                <td className="p-4 text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#0A0A0B] border-white/10 text-white">
                                            <DropdownMenuItem onClick={() => handleEdit(user)} className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                                                <Pencil className="mr-2 h-4 w-4" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleToggleStatus(user)} className="cursor-pointer hover:bg-white/10 focus:bg-white/10">
                                                <AlertCircle className="mr-2 h-4 w-4" />
                                                {user.userStatus === "ACTIVE" ? "Deactivate User" : "Activate User"}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(user.id)} className="cursor-pointer text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 hover:text-red-400">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete User
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                        {!loading && users.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">
                                    No users found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <UserManagementModal
                isOpen={isModalOpen}
                onClose={handleModalClose}
                user={selectedUser}
            />
        </div>
    );
}
