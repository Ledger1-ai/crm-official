"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { Folder, CalendarIcon, ArrowRight } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ProjectMemberWithBoard {
    id: string;
    project: string;
    assignedAt: Date;
    board: {
        id: string;
        title: string;
        description: string;
        status: string;
    };
}

interface NewProjectsWidgetProps {
    projects: ProjectMemberWithBoard[];
}

export default function NewProjectsWidget({ projects }: NewProjectsWidgetProps) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border-amber-500/20 hover:border-amber-500/40 border-dashed w-full justify-between">
                    <div className="flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        <span className="hidden sm:inline">New Projects</span>
                    </div>
                    <Badge className="ml-1 px-1.5 h-5 min-w-[1.25rem] flex items-center justify-center bg-amber-500 hover:bg-amber-600 border-none">
                        {projects.length}
                    </Badge>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-500">
                        <Folder className="h-5 w-5" />
                        New Projects This Week
                    </DialogTitle>
                    <DialogDescription>
                        {projects.length > 0
                            ? `You have been assigned to ${projects.length} new project${projects.length === 1 ? '' : 's'} this week.`
                            : "No new project assignments this week."}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] mt-4 pr-4">
                    <div className="space-y-3">
                        {projects.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground opacity-60">
                                <Folder className="h-12 w-12 mb-3" />
                                <p>No new projects</p>
                            </div>
                        )}

                        {projects.map((item) => (
                            <div key={item.id} className="group flex items-start gap-3 p-3 rounded-lg border bg-card/50 hover:bg-muted/50 transition-colors">
                                <div className="space-y-1.5 overflow-hidden flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium truncate block">
                                            {item.board.title}
                                        </span>
                                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 capitalize">
                                            {item.board.status.toLowerCase()}
                                        </Badge>
                                    </div>

                                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                                        <span className="truncate opacity-80" title={item.board.description}>
                                            {item.board.description}
                                        </span>
                                        <span className="flex items-center gap-1 opacity-70">
                                            <CalendarIcon className="h-3 w-3" />
                                            Assigned: {format(new Date(item.assignedAt), "PPP")}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                    </div>
                </ScrollArea>

                <div className="mt-4 pt-4 border-t flex justify-end">
                    <Link href="/crm/my-projects">
                        <Button variant="ghost" className="text-amber-500 hover:text-amber-600 hover:bg-amber-500/10">
                            View All My Projects <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    );
}
