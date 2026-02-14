"use client";

import React, { useMemo } from "react";
import useSWR from "swr";
import fetcher from "@/lib/fetcher";
import Gantt from "../../boards/[boardId]/components/Gantt";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Loader2, BarChart2 } from "lucide-react";
import Link from "next/link";

type Props = { userId: string };

export default function GlobalGanttView({ userId }: Props) {
    // Fetch all boards/campaigns
    const { data: boardsData, isLoading: boardsLoading } = useSWR<{ boards?: any[] }>(
        `/api/projects?userId=${userId}`,
        fetcher,
        { refreshInterval: 60000 }
    );

    // Combine all sections from all boards
    const allSections = useMemo(() => {
        const boards = boardsData?.boards || [];
        const sections: any[] = [];

        for (const board of boards) {
            // Each board may have sections with tasks
            if (Array.isArray(board.sections)) {
                for (const section of board.sections) {
                    sections.push({
                        id: section.id,
                        title: `${board.title} → ${section.title}`,
                        tasks: section.tasks || [],
                    });
                }
            }
        }

        return sections;
    }, [boardsData]);

    if (boardsLoading) {
        return (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin mr-3" />
                Loading projects timeline...
            </div>
        );
    }

    if (allSections.length === 0) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-16 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <BarChart2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No timeline data</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                        Create projects and add tasks with due dates to see them in the Gantt view.
                    </p>
                    <Link
                        href="/campaigns"
                        className="inline-flex items-center gap-2 text-primary hover:underline"
                    >
                        <FolderOpen className="h-4 w-4" /> Go to Projects
                    </Link>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-muted-foreground">
                        Showing tasks across {allSections.length} sections
                    </p>
                </div>
            </div>

            {/* Gantt Chart */}
            <div className="rounded-xl border border-border/50 bg-background/50 overflow-hidden">
                <Gantt data={allSections} />
            </div>
        </div>
    );
}
