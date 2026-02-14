"use client";

import { ModuleColumn } from "./Columns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CellAction } from "./cell-action";
import { Box, CheckCircle2, XCircle } from "lucide-react";

interface ModuleCardProps {
    module: ModuleColumn;
}

export function ModuleCard({ module }: ModuleCardProps) {
    return (
        <Card className="mb-4">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Box className="w-4 h-4 text-primary" />
                        </div>
                        <div className="font-semibold text-lg">{module.name}</div>
                    </div>
                    <CellAction data={module} />
                </div>
            </CardHeader>
            <CardContent className="pb-2 text-sm space-y-2">
                <div className="flex justify-between items-center p-2 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={module.enabled ? "default" : "secondary"} className="flex items-center gap-1">
                        {module.enabled ? (
                            <>
                                <CheckCircle2 className="w-3 h-3" /> Enabled
                            </>
                        ) : (
                            <>
                                <XCircle className="w-3 h-3" /> Disabled
                            </>
                        )}
                    </Badge>
                </div>
                <div className="flex justify-between items-center text-xs text-muted-foreground px-2">
                    <span>ID: {module.id}</span>
                </div>
            </CardContent>
        </Card>
    );
}
