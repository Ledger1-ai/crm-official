"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, Shield, User, Eye, Check } from "lucide-react";
import { addMember, getOrganizationMembers } from "@/actions/teams/member-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";

interface AddDepartmentMemberModalProps {
    isOpen: boolean;
    onClose: () => void;
    departmentId: string;
    departmentName: string;
    organizationId: string;
}

type OrgMember = {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
    team_id: string | null;
    assigned_team?: {
        name: string;
        team_type: string;
    } | null;
};

export function AddDepartmentMemberModal({ isOpen, onClose, departmentId, departmentName, organizationId }: AddDepartmentMemberModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [members, setMembers] = useState<OrgMember[]>([]);
    const [selectedUser, setSelectedUser] = useState<OrgMember | null>(null);
    const [selectedRole, setSelectedRole] = useState("MEMBER");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openCombobox, setOpenCombobox] = useState(false);

    useEffect(() => {
        if (isOpen && organizationId) {
            const fetchMembers = async () => {
                setIsLoading(true);
                try {
                    const data = await getOrganizationMembers(organizationId);
                    setMembers(data as OrgMember[]);
                } catch (error) {
                    toast.error("Failed to load organization members");
                } finally {
                    setIsLoading(false);
                }
            };
            fetchMembers();
        }
    }, [isOpen, organizationId]);

    const handleAddMember = async () => {
        if (!selectedUser) return;

        setIsSubmitting(true);
        try {
            const result = await addMember(departmentId, selectedUser.id, selectedRole);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success(`${selectedUser.name || "User"} added to ${departmentName}`);
                onClose();
                setSelectedUser(null);
                setSelectedRole("MEMBER");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to add member");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Add Members to {departmentName}</DialogTitle>
                    <DialogDescription>
                        Select a team member to add to this department and assign their role.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* User Selection (Combobox) */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Select Team Member</label>
                        <div className="border rounded-md shadow-sm">
                            <Command
                                filter={(value, search) => {
                                    if (value.toLowerCase().includes(search.toLowerCase())) return 1;
                                    return 0;
                                }}
                            >
                                <CommandInput placeholder="Search team members by name or email..." />
                                <CommandList className="max-h-[300px] overflow-y-auto">
                                    <CommandEmpty>No member found.</CommandEmpty>
                                    <CommandGroup heading="Organization Members">
                                        {members.map((member) => (
                                            <CommandItem
                                                key={member.id}
                                                value={`${member.name || ""} ${member.email || ""}`.trim()}
                                                onSelect={() => {
                                                    setSelectedUser(member);
                                                }}
                                                className="cursor-pointer aria-selected:bg-accent py-3 data-[disabled]:opacity-100 data-[disabled]:pointer-events-auto"
                                            >
                                                <div className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    selectedUser?.id === member.id ? "bg-primary text-primary-foreground" : "opacity-50 [&_svg]:invisible"
                                                )}>
                                                    <Check className={cn("h-4 w-4")} />
                                                </div>
                                                <div className="flex items-center gap-3 flex-1">
                                                    <Avatar className="h-8 w-8">
                                                        {member.avatar ? <AvatarImage src={member.avatar} /> : null}
                                                        <AvatarFallback className="text-xs">{(member.name || "?")[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold">{member.name}</span>
                                                        <span className="text-xs text-muted-foreground">{member.email}</span>
                                                    </div>
                                                </div>
                                                {member.assigned_team?.team_type === 'DEPARTMENT' && (
                                                    <Badge variant="secondary" className="text-[10px] ml-auto">
                                                        {member.assigned_team.name}
                                                    </Badge>
                                                )}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </div>
                    </div>

                    {/* Role Selection (Visible if selected) */}
                    {selectedUser && (
                        <div className="space-y-4 border rounded-md p-4 bg-muted/20 animate-in fade-in-0 slide-in-from-top-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Assign Department Role</label>
                                <Select value={selectedRole} onValueChange={setSelectedRole}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ADMIN">
                                            <div className="flex items-center gap-2">
                                                <Shield className="w-4 h-4 text-amber-500" />
                                                <span>Department Admin</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="MEMBER">
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-blue-500" />
                                                <span>Member</span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="VIEWER">
                                            <div className="flex items-center gap-2">
                                                <Eye className="w-4 h-4 text-slate-500" />
                                                <span>Viewer</span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-muted-foreground">
                                    {selectedRole === "ADMIN" && "Can manage department settings and members."}
                                    {selectedRole === "MEMBER" && "Standard access to department resources."}
                                    {selectedRole === "VIEWER" && "Read-only access to department resources."}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleAddMember} disabled={!selectedUser || isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Add Member
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
