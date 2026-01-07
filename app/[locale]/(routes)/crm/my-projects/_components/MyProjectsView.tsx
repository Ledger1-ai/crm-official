"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FolderKanban,
    Users,
    Rocket,
    Clock,
    Building2,
    ArrowRight,
    Sparkles,
    Loader2,
    MailIcon,
} from "lucide-react";
import Link from "next/link";

type Project = {
    id: string;
    title: string;
    description: string;
    status: string;
    role: string;
    assignedAt: string;
};

type Pool = {
    id: string;
    name: string;
    description?: string;
    candidatesCount: number;
    createdAt: string;
};

type Props = {
    userId: string;
};

export default function MyProjectsView({ userId }: Props) {
    const [loading, setLoading] = useState(true);
    const [projects, setProjects] = useState<Project[]>([]);
    const [pools, setPools] = useState<Pool[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch assigned projects
                const projectsRes = await fetch("/api/projects/my-assignments");
                if (projectsRes.ok) {
                    const data = await projectsRes.json();
                    setProjects(data.projects || []);
                }

                // Fetch assigned pools
                const poolsRes = await fetch("/api/leads/pools/my-assignments");
                if (poolsRes.ok) {
                    const data = await poolsRes.json();
                    setPools(data.pools || []);
                }
            } catch (error) {
                console.error("Failed to fetch assignments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const hasNoAssignments = projects.length === 0 && pools.length === 0;

    return (
        <div className="space-y-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
            >
                <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border-none">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FolderKanban className="w-6 h-6 text-indigo-400" />
                            My Assignments
                        </CardTitle>
                        <CardDescription>
                            Projects and lead pools assigned to you by your admin. Start campaigns from here.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </motion.div>

            {hasNoAssignments ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <Card className="text-center py-12">
                        <CardContent>
                            <div className="mx-auto w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                                <Clock className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-semibold mb-2">No Assignments Yet</h3>
                            <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                Your admin hasn't assigned any projects or lead pools to you yet.
                                Check back later or contact your admin for access.
                            </p>
                        </CardContent>
                    </Card>
                </motion.div>
            ) : (
                <>
                    {/* Assigned Projects */}
                    {projects.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-muted-foreground" />
                                Assigned Projects ({projects.length})
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project, index) => (
                                    <motion.div
                                        key={project.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Card className="h-full hover:border-primary/30 transition-colors">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <CardTitle className="text-base">{project.title}</CardTitle>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {project.role}
                                                    </Badge>
                                                </div>
                                                <CardDescription className="line-clamp-2">
                                                    {project.description}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between">
                                                    <Badge variant="outline" className="text-xs">
                                                        {project.status}
                                                    </Badge>
                                                    <Link href={`/projects/boards/${project.id}`}>
                                                        <Button variant="ghost" size="sm">
                                                            View <ArrowRight className="w-4 h-4 ml-1" />
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assigned Pools */}
                    {pools.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5 text-muted-foreground" />
                                Assigned Lead Pools ({pools.length})
                            </h3>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {pools.map((pool, index) => (
                                    <motion.div
                                        key={pool.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 + index * 0.1 }}
                                    >
                                        <Card className="h-full bg-gradient-to-br from-emerald-500/5 to-transparent hover:border-emerald-500/30 transition-colors">
                                            <CardHeader className="pb-3">
                                                <CardTitle className="text-base">{pool.name}</CardTitle>
                                                <CardDescription className="line-clamp-2">
                                                    {pool.description || "No description"}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="flex items-center justify-between">
                                                    <div className="text-sm text-muted-foreground">
                                                        <span className="font-medium text-foreground">{pool.candidatesCount}</span> leads
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Link href={`/crm/leads/pools?poolId=${pool.id}`}>
                                                            <Button variant="outline" size="sm">
                                                                View Leads
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/crm/leads/pools/${pool.id}/campaign`}>
                                                            <Button size="sm" className="bg-gradient-to-r from-emerald-600 to-green-600">
                                                                <Rocket className="w-4 h-4 mr-1" />
                                                                Campaign
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Quick Actions */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
            >
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            Need More Leads?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            Contact your admin to request access to more lead pools or projects.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
