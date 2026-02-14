"use client";

import React, { useState } from "react";
import { WidgetWrapper } from "./WidgetWrapper";
import { Folder, CalendarIcon, ArrowRight, Plus, Rocket } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ProjectMemberWithBoard {
    id: string;
    project: string;
    assignedAt: Date;
    progression?: number;
    taskCount?: number;
    board: {
        id: string;
        title: string;
        description: string;
        status: string;
    };
}

interface ProjectsWidgetProps {
    projects: ProjectMemberWithBoard[];
}

const CircularProgress = ({ value, size = 32 }: { value: number; size?: number }) => {
    const radius = size * 0.4;
    const center = size / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className="text-white/10"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                />
                <circle
                    className="text-emerald-500 transition-all duration-1000"
                    strokeWidth="3"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={center}
                    cy={center}
                />
            </svg>
            <span className="absolute text-[8px] font-bold text-white/90">{value}%</span>
        </div>
    );
};

export const ProjectsWidget = ({ projects: initialProjects }: ProjectsWidgetProps) => {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredProjects = initialProjects.filter(p => {
        return p.board.title.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const rightAction = (
        <Link href="/campaigns">
            <Button
                size="sm"
                variant="outline"
                className="h-7 px-3 text-[10px] font-bold border-white/10 bg-white/5 hover:bg-white/10"
            >
                <Plus size={12} className="mr-1.5" />
                PROJECT
            </Button>
        </Link>
    );

    return (
        <WidgetWrapper
            title="My Projects"
            icon={Rocket}
            iconColor="text-amber-400"
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            footerHref="/campaigns"
            footerLabel="View All Projects"
            count={initialProjects.length}
            rightAction={rightAction}
        >
            <div className="space-y-1 pb-4 mt-2">
                {filteredProjects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground/30">
                        <Folder className="h-10 w-10 mb-2 opacity-10" />
                        <p className="text-[11px] font-medium italic">No projects found</p>
                    </div>
                ) : (
                    filteredProjects.map((item) => (
                        <div
                            key={item.id}
                            className="group flex items-start justify-between gap-3 p-3 rounded-xl border border-transparent hover:border-white/5 hover:bg-white/[0.03] transition-all duration-300"
                        >
                            <div className="shrink-0 pt-0.5">
                                <CircularProgress value={item.progression || 0} />
                            </div>
                            <div className="space-y-1.5 overflow-hidden flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white/90 truncate group-hover:text-primary transition-colors">
                                        {item.board.title}
                                    </span>
                                    <Badge variant="outline" className="text-[8px] h-4 px-1 capitalize border-white/10 text-muted-foreground">
                                        {item.board.status.toLowerCase()}
                                    </Badge>
                                </div>

                                <div className="flex flex-col gap-1 text-[10px] text-muted-foreground font-medium">
                                    {item.board.description && (
                                        <span className="truncate opacity-60 italic">
                                            {item.board.description}
                                        </span>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1.5 opacity-70">
                                            <CalendarIcon size={10} />
                                            Joined {format(new Date(item.assignedAt), "MMM d, yyyy")}
                                        </span>
                                        {item.taskCount !== undefined && (
                                            <span className="opacity-50">
                                                {item.taskCount} tasks
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="shrink-0 pt-1">
                                <Link href={`/projects/boards/${item.board.id}`}>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 bg-white/5 hover:bg-primary hover:text-white transition-all duration-300"
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </WidgetWrapper>
    );
};
