"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";

import { updateTeam } from "@/actions/teams/update-team";
import { deleteTeam } from "@/actions/teams/delete-team";

type Team = {
    id: string;
    name: string;
    slug: string;
    owner_id: string | null;
    members: any[];
    subscription_plan?: "FREE" | "TEAM" | "ENTERPRISE";
};

type Props = {
    team: Team;
};

const TeamSettingsForm = ({ team }: Props) => {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: team.name,
        slug: team.slug,
        owner_id: team.owner_id || "", // ensure string
        subscription_plan: team.subscription_plan || "FREE",
    });

    const handleSave = async () => {
        try {
            setIsLoading(true);
            const res = await updateTeam(team.id, {
                name: formData.name,
                slug: formData.slug,
                owner_id: formData.owner_id || undefined,
                subscription_plan: formData.subscription_plan as any
            });

            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Team settings saved!");
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async () => {
        try {
            setIsLoading(true);
            const res = await deleteTeam(team.id);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Team deleted");
                router.push("/partners");
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to delete");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Team Settings</CardTitle>
                    <CardDescription>
                        Manage basic team information and primary contact.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Team Name</label>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Brand Key (Slug)</label>
                        <Input
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        />
                        <p className="text-xs text-muted-foreground">This works as the unique ID for the team instance.</p>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Point of Contact (Owner)</label>
                        <Select
                            value={formData.owner_id || undefined}
                            onValueChange={(val) => setFormData({ ...formData, owner_id: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select an owner" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none" disabled>Select Owner</SelectItem>
                                {team.members.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.name || member.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Subscription Plan</label>
                        <Select
                            value={formData.subscription_plan}
                            onValueChange={(val) => setFormData({ ...formData, subscription_plan: val as any })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Plan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="FREE">Free</SelectItem>
                                <SelectItem value="TEAM">Team</SelectItem>
                                <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
                <CardFooter className="border-t p-4 bg-muted/20 flex justify-end">
                    <Button onClick={handleSave} disabled={isLoading}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                    </Button>
                </CardFooter>
            </Card>

            <Card className="border-red-200">
                <CardHeader>
                    <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    <CardDescription>
                        Irreversible actions for this team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        Deleting this team will remove it permanently. Members will be unassigned but not deleted.
                    </p>
                    <Button variant="destructive" onClick={async () => {
                        if (confirm("Are you absolutely sure accessing this team?")) {
                            // Double confirm
                            if (confirm("This action cannot be undone. Delete team?")) {
                                await handleDelete();
                            }
                        }
                    }} disabled={isLoading}>
                        Delete Team
                    </Button>
                </CardContent>
            </Card>
        </>
    );
};

export default TeamSettingsForm;
