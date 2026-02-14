
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { createTeam } from "@/actions/teams/create-team";
import { NavigationCard, NavigationCardData } from "./NavigationCard";

type CreateTeamCardProps = {
    availablePlans: any[];
};

export const CreateTeamCard = ({ availablePlans }: CreateTeamCardProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [planId, setPlanId] = useState("");

    const handleCreate = async () => {
        try {
            setIsLoading(true);
            const res = await createTeam(name, slug, planId || undefined);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Team created!");
                setOpen(false);
                router.refresh();
                setName("");
                setSlug("");
                setPlanId("");
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-generate slug
    useEffect(() => {
        if (name) {
            setSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        }
    }, [name]);

    const cardData: NavigationCardData = {
        title: "Partner Hub",
        description: "Create organization",
        icon: Plus,
        color: "from-pink-500/20 to-rose-500/20",
        iconColor: "text-pink-500"
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <div className="h-full w-full">
                    <NavigationCard card={cardData} />
                </div>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Team</DialogTitle>
                    <DialogDescription>
                        Add a new partner organization or team instance.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Team Name</label>
                        <Input
                            placeholder="e.g. Acme Corp"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Brand Key (Slug)</label>
                        <Input
                            placeholder="e.g. acme-corp"
                            value={slug}
                            onChange={(e) => setSlug(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Subscription Plan</label>
                        <Select
                            value={planId}
                            onValueChange={(val) => setPlanId(val)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select Plan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none" disabled>Select Plan</SelectItem>
                                {availablePlans.map((plan) => (
                                    <SelectItem key={plan.id} value={plan.id}>
                                        {plan.name} ({plan.currency} {plan.price})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={isLoading}>Create Team</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
