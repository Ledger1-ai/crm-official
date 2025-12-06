// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Users as UsersIcon, Edit, Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { createTeam } from "@/actions/teams/create-team";
import { seedInternalTeam } from "@/actions/teams/seed-team";
import { toast } from "react-hot-toast";

type Team = {
    id: string;
    name: string;
    slug: string;
    created_at: Date;
    members: {
        id: string;
        name: string | null;
        email: string;
        avatar: string | null;
    }[];
};

type Props = {
    initialTeams: Team[];
};

const LinkHref = Link as any;

const PartnersView = ({ initialTeams }: Props) => {
    const router = useRouter();
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [isLoading, setIsLoading] = useState(false);

    // Create Modal State
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");

    const handleCreate = async () => {
        try {
            setIsLoading(true);
            const res = await createTeam(name, slug);
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success("Team created!");
                setOpen(false);
                router.refresh();
            }
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeed = async () => {
        try {
            setIsLoading(true);
            const res = await seedInternalTeam();
            if (res.error) {
                toast.error(res.error);
            } else {
                toast.success(`Internal Team Seeded! Updated ${res.count} users.`);
                router.refresh();
            }
        } catch (error) {
            toast.error("Failed to seed");
        } finally {
            setIsLoading(false);
        }
    }

    // Auto-generate slug
    useEffect(() => {
        if (name) {
            setSlug(name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''));
        }
    }, [name]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Teams & Partners</h2>
                    <p className="text-muted-foreground">Manage your organizations and their access.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleSeed} disabled={isLoading}>
                        <Lock className="w-4 h-4 mr-2" />
                        Seed Internal Team
                    </Button>

                    {teams.find(t => t.slug === 'internal') && (
                        <LinkHref href={`/partners/${teams.find(t => t.slug === 'internal')?.id}`}>
                            <Button variant="secondary">
                                <UsersIcon className="w-4 h-4 mr-2" />
                                Manage Internal Team
                            </Button>
                        </LinkHref>
                    )}

                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="w-4 h-4 mr-2" />
                                Create Team
                            </Button>
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
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={isLoading}>Create Team</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team) => (
                    <Card key={team.id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{team.name}</CardTitle>
                                    <CardDescription className="font-mono text-xs mt-1">{team.slug}</CardDescription>
                                </div>
                                <Badge variant="outline">{team.members.length} Members</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex -space-x-2 overflow-hidden">
                                {team.members.slice(0, 5).map((member) => (
                                    <div key={member.id} className="h-8 w-8 rounded-full ring-2 ring-background bg-slate-200 flex items-center justify-center overflow-hidden" title={member.name || member.email}>
                                        {member.avatar ? (
                                            <img src={member.avatar} alt={member.name || "User"} className="h-full w-full object-cover" />
                                        ) : (
                                            <span className="text-xs font-semibold text-slate-500">{(member.name || member.email)[0].toUpperCase()}</span>
                                        )}
                                    </div>
                                ))}
                                {team.members.length > 5 && (
                                    <div className="h-8 w-8 rounded-full ring-2 ring-background bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-500">
                                        +{team.members.length - 5}
                                    </div>
                                )}
                                {team.members.length === 0 && (
                                    <span className="text-sm text-muted-foreground italic">No members yet</span>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-between border-t p-4 bg-muted/20">
                            <span className="text-xs text-muted-foreground">
                                Created {new Date(team.created_at).toLocaleDateString()}
                            </span>
                            <LinkHref href={`/partners/${team.id}`}>
                                <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4 mr-2" />
                                    Manage
                                </Button>
                            </LinkHref>
                        </CardFooter>
                    </Card>
                ))}

                {teams.length === 0 && (
                    <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/10 rounded-lg border border-dashed">
                        <UsersIcon className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <h3 className="text-lg font-medium">No teams found</h3>
                        <p>Get started by creating your first team.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PartnersView;
