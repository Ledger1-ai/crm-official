"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, Plus, Trash, User, Shield, Lock, Settings } from "lucide-react";
import { updateProfile } from "@/actions/cms-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface AdminUser {
    id: string;
    name: string;
    email: string;
    is_admin: boolean;
    createdAt: string;
}

export default function AdminSettingsPage() {
    return (
        <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white">Settings</h1>
                <p className="text-slate-400 mt-1">Manage your profile and system preferences.</p>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="mb-8">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="team">Team & Admins</TabsTrigger>
                </TabsList>

                <TabsContent value="profile">
                    <ProfileSettings />
                </TabsContent>

                <TabsContent value="team">
                    <TeamSettings />
                </TabsContent>
            </Tabs>
        </div>
    );
}

function ProfileSettings() {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await updateProfile({ name: name || undefined, password: password || undefined });
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Profile updated successfully");
                setPassword(""); // Clear password field
            }
        } catch (error) {
            toast.error("Failed to update profile");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-lg p-6 max-w-2xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-white">
                <User className="h-5 w-5 text-blue-500" /> Your Profile
            </h2>
            <form onSubmit={handleUpdate} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">Display Name</label>
                    <input
                        className="w-full p-2 border rounded-md bg-slate-900 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 transition-colors"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave empty to keep current name</p>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1 text-slate-300">New Password</label>
                    <input
                        type="password"
                        className="w-full p-2 border rounded-md bg-slate-900 border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500 transition-colors"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-xs text-slate-500 mt-1">Leave empty to keep current password. Min 6 chars.</p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 disabled:opacity-50"
                >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />} Update Profile
                </button>
            </form>
        </div>
    );
}

function TeamSettings() {
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
    const [adding, setAdding] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch("/api/admin/users");
            const data = await res.json();
            setUsers(data);
        } catch (error) {
            toast.error("Failed to fetch admins");
        } finally {
            setLoading(false);
        }
    };

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setAdding(true);

        try {
            const res = await fetch("/api/admin/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });

            if (!res.ok) throw new Error("Failed to add user");

            toast.success("Admin user added");
            setShowAddModal(false);
            setNewUser({ name: "", email: "", password: "" });
            fetchUsers();
        } catch (error) {
            toast.error("Failed to add user");
        } finally {
            setAdding(false);
        }
    };

    const handleRemoveAdmin = async (id: string) => {
        if (!confirm("Are you sure you want to remove admin access for this user?")) return;

        try {
            const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Failed to remove");
            toast.success("Admin access removed");
            fetchUsers();
        } catch (error: any) {
            toast.error("Failed to remove admin");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2 text-white">
                        <Shield className="h-5 w-5 text-blue-500" /> Admin Users
                    </h2>
                    <p className="text-sm text-slate-400">Manage who has access to this CMS.</p>
                </div>

                <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                    <DialogTrigger asChild>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Add Admin
                        </button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Add New Admin</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleAddUser} className="space-y-4 pt-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300">Name</label>
                                <input
                                    className="w-full p-2 border rounded bg-slate-900 border-white/10 text-white placeholder:text-slate-500"
                                    value={newUser.name}
                                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300">Email</label>
                                <input
                                    type="email"
                                    className="w-full p-2 border rounded bg-slate-900 border-white/10 text-white placeholder:text-slate-500"
                                    value={newUser.email}
                                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-300">Password</label>
                                <input
                                    type="password"
                                    className="w-full p-2 border rounded bg-slate-900 border-white/10 text-white placeholder:text-slate-500"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    type="submit"
                                    disabled={adding}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2 w-full justify-center"
                                >
                                    {adding && <Loader2 className="h-4 w-4 animate-spin" />} Add Admin User
                                </button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="bg-slate-950/50 backdrop-blur-xl border border-white/10 rounded-lg overflow-hidden">
                <div className="divide-y divide-white/10">
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400" /></div>
                    ) : users.length === 0 ? (
                        <div className="p-8 text-center text-slate-500">No admin users found.</div>
                    ) : (
                        users.map((user) => (
                            <div key={user.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-slate-800 rounded-full flex items-center justify-center">
                                        <User className="h-5 w-5 text-slate-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-white">{user.name || "Unnamed"}</div>
                                        <div className="text-sm text-slate-500">{user.email}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded-full">Active</span>
                                    <button
                                        onClick={() => handleRemoveAdmin(user.id)}
                                        className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                                        title="Remove Admin Access"
                                    >
                                        <Trash className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
