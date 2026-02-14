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
    FileText,
    CheckSquare,
    BarChart2,
    Calendar,
} from "lucide-react";
import Link from "next/link";
import { ViewToggle, type ViewMode } from "@/components/ViewToggle";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
    const [viewMode, setViewMode] = useState<ViewMode>("card");

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

    // Grid column classes based on view mode
    const getGridClasses = () => {
        switch (viewMode) {
            case "table":
                return ""; // Table doesn't use grid
            case "compact":
                return "grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
            case "card":
            default:
                return "grid gap-4 md:grid-cols-2 lg:grid-cols-3";
        }
    };

    return (
        <div className="space-y-6">



            {/* Navigation Buttons Row - Glassmorphism style similar to /crm/leads */}
            <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
                {/* My Tasks Button */}
                <Link href={`/campaigns/tasks/${userId}`}>
                    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 opacity-20 group-hover:opacity-60 transition-opacity duration-300" />
                        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="p-3 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-border shadow-lg group-hover:scale-110 transition-transform duration-300 text-blue-400 ring-1 ring-white/20 group-hover:ring-white/40">
                                <CheckSquare className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    My Tasks
                                </span>
                                <span className="block text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                    View assigned tasks
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Gantt View Button */}
                <Link href="/campaigns/gantt">
                    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-violet-500/20 opacity-20 group-hover:opacity-60 transition-opacity duration-300" />
                        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="p-3 rounded-full bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-border shadow-lg group-hover:scale-110 transition-transform duration-300 text-purple-400 ring-1 ring-white/20 group-hover:ring-white/40">
                                <BarChart2 className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    Gantt View
                                </span>
                                <span className="block text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                    Project timeline
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Calendar Button */}
                <Link href="/campaigns/calendar">
                    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-green-500/20 opacity-20 group-hover:opacity-60 transition-opacity duration-300" />
                        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="p-3 rounded-full bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-border shadow-lg group-hover:scale-110 transition-transform duration-300 text-emerald-400 ring-1 ring-white/20 group-hover:ring-white/40">
                                <Calendar className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    Calendar
                                </span>
                                <span className="block text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                    Task deadlines
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>

                {/* Documents Button */}
                <Link href="/documents">
                    <div className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 hover:bg-accent/50 transition-all duration-300 backdrop-blur-md shadow-lg hover:shadow-xl hover:scale-[1.02] h-full">
                        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 to-blue-500/20 opacity-20 group-hover:opacity-60 transition-opacity duration-300" />
                        <div className="relative z-10 flex flex-col items-center justify-center text-center space-y-2">
                            <div className="p-3 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-border shadow-lg group-hover:scale-110 transition-transform duration-300 text-sky-400 ring-1 ring-white/20 group-hover:ring-white/40">
                                <FileText className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                    Documents
                                </span>
                                <span className="block text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">
                                    View your files
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
            </motion.div>

            {/* View Toggle Row */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="flex justify-end"
            >
                <ViewToggle value={viewMode} onChange={setViewMode} />
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
                                Your admin hasn&apos;t assigned any projects or lead pools to you yet.
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

                            {viewMode === "table" ? (
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Project</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {projects.map((project) => (
                                                <TableRow key={project.id}>
                                                    <TableCell className="font-medium">{project.title}</TableCell>
                                                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                                        {project.description}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {project.role}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="text-xs">
                                                            {project.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Link href={`/campaigns/boards/${project.id}`}>
                                                            <Button variant="ghost" size="sm">
                                                                View <ArrowRight className="w-4 h-4 ml-1" />
                                                            </Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className={getGridClasses()}>
                                    {projects.map((project, index) => (
                                        <motion.div
                                            key={project.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                        >
                                            <Card className={`h-full hover:border-primary/30 transition-colors ${viewMode === "compact" ? "p-3" : ""}`}>
                                                <CardHeader className={viewMode === "compact" ? "p-0 pb-2" : "pb-3"}>
                                                    <div className="flex items-start justify-between">
                                                        <CardTitle className={viewMode === "compact" ? "text-sm" : "text-base"}>
                                                            {project.title}
                                                        </CardTitle>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {project.role}
                                                        </Badge>
                                                    </div>
                                                    {viewMode !== "compact" && (
                                                        <CardDescription className="line-clamp-2">
                                                            {project.description}
                                                        </CardDescription>
                                                    )}
                                                </CardHeader>
                                                <CardContent className={viewMode === "compact" ? "p-0" : ""}>
                                                    <div className="flex items-center justify-between">
                                                        <Badge variant="outline" className="text-xs">
                                                            {project.status}
                                                        </Badge>
                                                        <Link href={`/campaigns/boards/${project.id}`}>
                                                            <Button variant="ghost" size="sm" className={viewMode === "compact" ? "h-7 text-xs" : ""}>
                                                                View <ArrowRight className="w-4 h-4 ml-1" />
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Assigned Pools */}
                    {pools.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Users className="w-5 h-5 text-muted-foreground" />
                                Assigned Lead Pools ({pools.length})
                            </h3>

                            {viewMode === "table" ? (
                                <div className="rounded-lg border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Pool Name</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Leads</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pools.map((pool) => (
                                                <TableRow key={pool.id}>
                                                    <TableCell className="font-medium">{pool.name}</TableCell>
                                                    <TableCell className="text-muted-foreground max-w-[200px] truncate">
                                                        {pool.description || "No description"}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="font-medium">{pool.candidatesCount}</span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex gap-2 justify-end">
                                                            <Link href={`/crm/leads/pools?poolId=${pool.id}`}>
                                                                <Button variant="outline" size="sm">
                                                                    View Leads
                                                                </Button>
                                                            </Link>
                                                            <Link href={`/crm/leads/pools/${pool.id}/campaign`}>
                                                                <Button size="sm" className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white border-none">
                                                                    <Rocket className="w-4 h-4 mr-1" />
                                                                    Outreach
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className={getGridClasses()}>
                                    {pools.map((pool, index) => (
                                        <motion.div
                                            key={pool.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 + index * 0.1 }}
                                        >
                                            <Card className={`h-full bg-gradient-to-br from-emerald-500/5 to-transparent hover:border-emerald-500/30 transition-colors ${viewMode === "compact" ? "p-3" : ""}`}>
                                                <CardHeader className={viewMode === "compact" ? "p-0 pb-2" : "pb-3"}>
                                                    <CardTitle className={viewMode === "compact" ? "text-sm" : "text-base"}>
                                                        {pool.name}
                                                    </CardTitle>
                                                    {viewMode !== "compact" && (
                                                        <CardDescription className="line-clamp-2">
                                                            {pool.description || "No description"}
                                                        </CardDescription>
                                                    )}
                                                </CardHeader>
                                                <CardContent className={viewMode === "compact" ? "p-0" : ""}>
                                                    <div className={`flex items-center ${viewMode === "compact" ? "flex-col gap-2" : "justify-between"}`}>
                                                        <div className="text-sm text-muted-foreground">
                                                            <span className="font-medium text-foreground">{pool.candidatesCount}</span> leads
                                                        </div>
                                                        <div className={`flex gap-2 ${viewMode === "compact" ? "w-full" : ""}`}>
                                                            <Link href={`/crm/leads/pools?poolId=${pool.id}`} className={viewMode === "compact" ? "flex-1" : ""}>
                                                                <Button variant="outline" size="sm" className={viewMode === "compact" ? "w-full h-7 text-xs" : ""}>
                                                                    View Leads
                                                                </Button>
                                                            </Link>
                                                            <Link href={`/crm/leads/pools/${pool.id}/campaign`} className={viewMode === "compact" ? "flex-1" : ""}>
                                                                <Button size="sm" className={`bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white border-none ${viewMode === "compact" ? "w-full h-7 text-xs" : ""}`}>
                                                                    <Rocket className="w-4 h-4 mr-1" />
                                                                    {viewMode === "compact" ? "" : "Outreach"}
                                                                </Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}
            {/* Footer Row: My Assignments + Need More Leads horizontally aligned */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t"
            >
                {/* My Assignments Card */}
                <Card className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent border-none">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <FolderKanban className="w-5 h-5 text-indigo-400" />
                            My Assignments
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Projects and lead pools assigned to you by your admin. Start outreach from here.
                        </CardDescription>
                    </CardHeader>
                </Card>

                {/* Need More Leads Card */}
                <Card className="bg-muted/30">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-amber-400" />
                            Need More Leads?
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Contact your admin to request access to more lead pools or projects.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </motion.div>
        </div>
    );
}
